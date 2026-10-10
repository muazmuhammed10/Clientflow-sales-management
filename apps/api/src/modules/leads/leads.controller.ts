import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { logAudit } from '../../utils/audit';

export const listLeads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const search = (req.query.search as string)?.trim() || '';
    const status = req.query.status as string;
    const source = req.query.source as string;
    const priority = req.query.priority as string;
    const assignedToId = req.query.assignedToId as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 'asc' : 'desc';

    const where: any = {
      organizationId: req.organizationId,
    };

    if (status) where.status = status;
    if (source) where.source = source;
    if (priority) where.priority = priority;
    if (assignedToId) where.assignedToId = assignedToId;

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: leads,
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

export const getLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        organizationId: req.organizationId,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    // Check potential duplicate leads in this organization
    let duplicates: any[] = [];
    if (lead.email) {
      duplicates = await prisma.lead.findMany({
        where: {
          organizationId: req.organizationId,
          id: { not: lead.id },
          email: { equals: lead.email, mode: 'insensitive' },
        },
        select: { id: true, firstName: true, lastName: true, companyName: true, status: true },
      });
    }

    res.json({
      success: true,
      data: {
        ...lead,
        potentialDuplicates: duplicates,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body = req.body;

    const lead = await prisma.lead.create({
      data: {
        organizationId: req.organizationId!,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        companyName: body.companyName || null,
        jobTitle: body.jobTitle || null,
        source: body.source,
        industry: body.industry || null,
        status: body.status,
        priority: body.priority,
        estimatedValue: body.estimatedValue || 0,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        assignedToId: body.assignedToId || null,
        createdById: req.user!.id,
        notes: body.notes || null,
        tags: body.tags || [],
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Create initial activity log
    await prisma.activity.create({
      data: {
        organizationId: req.organizationId!,
        userId: req.user!.id,
        leadId: lead.id,
        type: 'STATUS_CHANGE',
        title: 'Lead Created',
        description: `Lead created with status "${lead.status}" by ${req.user!.firstName} ${req.user!.lastName}`,
      },
    });

    // If assigned to another user, send notification
    if (lead.assignedToId && lead.assignedToId !== req.user!.id) {
      await prisma.notification.create({
        data: {
          organizationId: req.organizationId!,
          userId: lead.assignedToId,
          type: 'LEAD_ASSIGNED',
          title: 'New Lead Assigned',
          message: `You were assigned lead: ${lead.firstName} ${lead.lastName}`,
          link: `/leads/${lead.id}`,
        },
      });
    }

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'LEAD_CREATED',
      entityType: 'LEAD',
      entityId: lead.id,
      details: { name: `${lead.firstName} ${lead.lastName}`, email: lead.email },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existingLead = await prisma.lead.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!existingLead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.firstName !== undefined ? { firstName: body.firstName } : {}),
        ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.companyName !== undefined ? { companyName: body.companyName || null } : {}),
        ...(body.jobTitle !== undefined ? { jobTitle: body.jobTitle || null } : {}),
        ...(body.source !== undefined ? { source: body.source } : {}),
        ...(body.industry !== undefined ? { industry: body.industry || null } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.estimatedValue !== undefined ? { estimatedValue: body.estimatedValue } : {}),
        ...(body.expectedCloseDate !== undefined
          ? { expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null }
          : {}),
        ...(body.assignedToId !== undefined ? { assignedToId: body.assignedToId || null } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
        ...(body.tags !== undefined ? { tags: body.tags } : {}),
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Record activity if status changed
    if (body.status && body.status !== existingLead.status) {
      await prisma.activity.create({
        data: {
          organizationId: req.organizationId!,
          userId: req.user!.id,
          leadId: updated.id,
          type: 'STATUS_CHANGE',
          title: 'Status Updated',
          description: `Status changed from "${existingLead.status}" to "${body.status}"`,
        },
      });
    }

    // Record activity and notification if assignedTo changed
    if (body.assignedToId && body.assignedToId !== existingLead.assignedToId) {
      if (body.assignedToId !== req.user!.id) {
        await prisma.notification.create({
          data: {
            organizationId: req.organizationId!,
            userId: body.assignedToId,
            type: 'LEAD_ASSIGNED',
            title: 'Lead Reassigned',
            message: `Lead ${updated.firstName} ${updated.lastName} was reassigned to you`,
            link: `/leads/${updated.id}`,
          },
        });
      }
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    await prisma.lead.delete({
      where: { id },
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'LEAD_DELETED',
      entityType: 'LEAD',
      entityId: id,
      details: { name: `${lead.firstName} ${lead.lastName}` },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const convertLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      createCompany = true,
      companyName,
      createContact = true,
      createDeal = true,
      dealName,
      dealAmount,
      dealStageId,
      dealExpectedCloseDate,
    } = req.body;

    const lead = await prisma.lead.findFirst({
      where: { id, organizationId: req.organizationId },
    });

    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }

    if (lead.status === 'CONVERTED') {
      res.status(400).json({
        success: false,
        error: 'This lead has already been converted and cannot be converted again',
      });
      return;
    }

    // Execute atomic conversion transaction
    const conversionResult = await prisma.$transaction(async (tx) => {
      let companyId: string | null = null;
      let contactId: string | null = null;
      let dealId: string | null = null;

      // 1. Create Company if requested or name available
      const finalCompanyName = companyName || lead.companyName;
      if (createCompany && finalCompanyName) {
        // Check if company already exists by name
        let existingCompany = await tx.company.findFirst({
          where: {
            organizationId: req.organizationId!,
            name: { equals: finalCompanyName.trim(), mode: 'insensitive' },
          },
        });

        if (!existingCompany) {
          existingCompany = await tx.company.create({
            data: {
              organizationId: req.organizationId!,
              name: finalCompanyName.trim(),
              industry: lead.industry,
              phone: lead.phone,
              ownerId: lead.assignedToId || req.user!.id,
              description: `Converted from lead: ${lead.firstName} ${lead.lastName}`,
            },
          });
        }
        companyId = existingCompany.id;
      }

      // 2. Create Contact if requested
      if (createContact) {
        let existingContact = lead.email
          ? await tx.contact.findFirst({
              where: {
                organizationId: req.organizationId!,
                email: { equals: lead.email, mode: 'insensitive' },
              },
            })
          : null;

        if (!existingContact) {
          existingContact = await tx.contact.create({
            data: {
              organizationId: req.organizationId!,
              firstName: lead.firstName,
              lastName: lead.lastName,
              email: lead.email,
              phone: lead.phone,
              jobTitle: lead.jobTitle,
              companyId,
              ownerId: lead.assignedToId || req.user!.id,
              notes: lead.notes,
            },
          });
        }
        contactId = existingContact.id;
      }

      // 3. Create Deal if requested
      if (createDeal) {
        // Resolve pipeline and initial stage if not provided
        let targetStageId = dealStageId;
        let targetPipelineId: string;

        if (!targetStageId) {
          const defaultPipeline = await tx.pipeline.findFirst({
            where: { organizationId: req.organizationId!, isDefault: true },
            include: { stages: { orderBy: { order: 'asc' } } },
          });

          if (!defaultPipeline || defaultPipeline.stages.length === 0) {
            throw new Error('No default pipeline or stages configured');
          }

          targetPipelineId = defaultPipeline.id;
          targetStageId = defaultPipeline.stages[0].id;
        } else {
          const stage = await tx.pipelineStage.findUnique({
            where: { id: targetStageId },
          });
          if (!stage) throw new Error('Selected pipeline stage was not found');
          targetPipelineId = stage.pipelineId;
        }

        const newDeal = await tx.deal.create({
          data: {
            organizationId: req.organizationId!,
            name: dealName || `${lead.companyName || lead.lastName} - Opportunity`,
            pipelineId: targetPipelineId,
            stageId: targetStageId,
            contactId,
            companyId,
            amount: dealAmount !== undefined ? dealAmount : lead.estimatedValue,
            ownerId: lead.assignedToId || req.user!.id,
            expectedCloseDate: dealExpectedCloseDate
              ? new Date(dealExpectedCloseDate)
              : lead.expectedCloseDate,
            source: lead.source,
            description: `Converted from lead ${lead.firstName} ${lead.lastName}`,
          },
        });
        dealId = newDeal.id;
      }

      // 4. Mark Lead as Converted
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          convertedByUserId: req.user!.id,
          convertedCompanyId: companyId,
          convertedContactId: contactId,
          convertedDealId: dealId,
        },
      });

      // 5. Create Conversion Activity Log
      await tx.activity.create({
        data: {
          organizationId: req.organizationId!,
          userId: req.user!.id,
          leadId: lead.id,
          contactId,
          companyId,
          dealId,
          type: 'LEAD_CONVERTED',
          title: 'Lead Converted',
          description: `Lead converted by ${req.user!.firstName} ${req.user!.lastName}. Created contact, company, and deal records.`,
          metadata: { companyId, contactId, dealId },
        },
      });

      return {
        lead: updatedLead,
        companyId,
        contactId,
        dealId,
      };
    });

    await logAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'LEAD_CONVERTED',
      entityType: 'LEAD',
      entityId: lead.id,
      details: {
        leadId: lead.id,
        companyId: conversionResult.companyId,
        contactId: conversionResult.contactId,
        dealId: conversionResult.dealId,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Lead converted successfully',
      data: conversionResult,
    });
  } catch (error) {
    next(error);
  }
};
