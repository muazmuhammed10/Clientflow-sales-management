import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export const listTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const type = req.query.type as string;
    const assignedToId = req.query.assignedToId as string;
    const filter = req.query.filter as string; // 'overdue' | 'today' | 'upcoming' | 'completed'

    const where: any = {
      organizationId: req.organizationId,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (assignedToId) where.assignedToId = assignedToId;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter === 'overdue') {
      where.dueDate = { lt: now };
      where.status = { in: ['TODO', 'IN_PROGRESS'] };
    } else if (filter === 'today') {
      where.dueDate = { gte: startOfToday, lte: endOfToday };
    } else if (filter === 'upcoming') {
      where.dueDate = { gt: endOfToday };
      where.status = { in: ['TODO', 'IN_PROGRESS'] };
    } else if (filter === 'completed') {
      where.status = 'COMPLETED';
    }

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          lead: { select: { id: true, firstName: true, lastName: true, companyName: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, name: true, amount: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body;

    const task = await prisma.task.create({
      data: {
        organizationId: req.organizationId!,
        title: body.title,
        description: body.description || null,
        type: body.type,
        priority: body.priority,
        status: body.status || 'TODO',
        dueDate: new Date(body.dueDate),
        assignedToId: body.assignedToId || req.user!.id,
        createdById: req.user!.id,
        leadId: body.leadId || null,
        contactId: body.contactId || null,
        companyId: body.companyId || null,
        dealId: body.dealId || null,
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
    });

    if (task.assignedToId && task.assignedToId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          organizationId: req.organizationId!,
          userId: task.assignedToId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `Task "${task.title}" was assigned to you (Due: ${new Date(task.dueDate).toLocaleDateString()})`,
          link: '/tasks',
        },
      });
    }

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.task.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    const isMarkingCompleted = body.status === 'COMPLETED' && existing.status !== 'COMPLETED';

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.dueDate !== undefined ? { dueDate: new Date(body.dueDate) } : {}),
        ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId || null } : {}),
        ...(body.leadId !== undefined ? { leadId: body.leadId || null } : {}),
        ...(body.contactId !== undefined ? { contactId: body.contactId || null } : {}),
        ...(body.companyId !== undefined ? { companyId: body.companyId || null } : {}),
        ...(body.dealId !== undefined ? { dealId: body.dealId || null } : {}),
        ...(isMarkingCompleted ? { completedAt: new Date() } : {}),
      },
      include: {
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
    });

    // Record activity if completed
    if (isMarkingCompleted) {
      await prisma.activity.create({
        data: {
          organizationId: req.organizationId!,
          userId: req.user!.id,
          leadId: updated.leadId,
          contactId: updated.contactId,
          companyId: updated.companyId,
          dealId: updated.dealId,
          type: 'TASK_COMPLETED',
          title: 'Task Completed',
          description: `Completed task: "${updated.title}"`,
        },
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    await prisma.task.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
