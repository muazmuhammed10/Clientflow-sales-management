import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export const listCompanies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const search = (req.query.search as string)?.trim() || '';
    const industry = req.query.industry as string;
    const size = req.query.size as string;
    const ownerId = req.query.ownerId as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: any = {
      organizationId: req.organizationId,
    };

    if (industry) where.industry = industry;
    if (size) where.size = size;
    if (ownerId) where.ownerId = ownerId;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: { select: { id: true, firstName: true, lastName: true } },
          _count: {
            select: { contacts: true, deals: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: companies,
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

export const getCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findFirst({
      where: { id, organizationId: req.organizationId },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        contacts: {
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          include: {
            stage: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!company) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const createCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body;

    const company = await prisma.company.create({
      data: {
        organizationId: req.organizationId!,
        name: body.name,
        website: body.website || null,
        industry: body.industry || null,
        size: body.size || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        description: body.description || null,
        ownerId: body.ownerId || req.user!.id,
        tags: body.tags || [],
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'COMPANY_CREATED',
      entityType: 'COMPANY',
      entityId: company.id,
      details: { name: company.name },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.company.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!existing) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }

    const updated = await prisma.company.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.website !== undefined ? { website: body.website || null } : {}),
        ...(body.industry !== undefined ? { industry: body.industry || null } : {}),
        ...(body.size !== undefined ? { size: body.size || null } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.address !== undefined ? { address: body.address || null } : {}),
        ...(body.city !== undefined ? { city: body.city || null } : {}),
        ...(body.country !== undefined ? { country: body.country || null } : {}),
        ...(body.description !== undefined ? { description: body.description || null } : {}),
        ...(body.ownerId !== undefined ? { ownerId: body.ownerId || null } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCompany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!company) {
      res.status(404).json({ success: false, error: 'Company not found' });
      return;
    }

    // Preserve history: detach contacts rather than cascading delete
    await prisma.contact.updateMany({
      where: { companyId: id },
      data: { companyId: null },
    });

    await prisma.company.delete({
      where: { id },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'COMPANY_DELETED',
      entityType: 'COMPANY',
      entityId: id,
      details: { name: company.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
