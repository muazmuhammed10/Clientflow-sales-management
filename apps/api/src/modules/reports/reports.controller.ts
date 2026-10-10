import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

const sanitizeCsvValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // Prevent CSV injection: if starts with =, +, -, @, prepend single quote
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  // Escape double quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const getReportsData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.organizationId!;
    const period = (req.query.period as string) || '30d'; // '7d', '30d', 'quarter', 'ytd', 'all'

    const now = new Date();
    let startDate: Date | undefined;

    if (period === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (period === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
    } else if (period === 'ytd') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    const dateFilter = startDate ? { gte: startDate } : undefined;

    // Fetch leads and deals in date range
    const [leads, deals, tasks, teamMembers] = await Promise.all([
      prisma.lead.findMany({
        where: {
          organizationId: orgId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.deal.findMany({
        where: {
          organizationId: orgId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        include: {
          stage: true,
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.task.findMany({
        where: {
          organizationId: orgId,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
      }),
      prisma.membership.findMany({
        where: { organizationId: orgId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
    ]);

    // Calculate metrics
    let totalWonRevenue = 0;
    let wonCount = 0;
    let lostCount = 0;
    let openCount = 0;
    let openPipelineValue = 0;
    let weightedForecast = 0;

    const repMap: {
      [id: string]: { name: string; wonRevenue: number; dealsCount: number; wonCount: number };
    } = {};

    for (const m of teamMembers) {
      repMap[m.user.id] = {
        name: `${m.user.firstName} ${m.user.lastName}`,
        wonRevenue: 0,
        dealsCount: 0,
        wonCount: 0,
      };
    }

    for (const d of deals) {
      const amt = Number(d.amount);
      if (d.ownerId && !repMap[d.ownerId]) {
        repMap[d.ownerId] = {
          name: d.owner ? `${d.owner.firstName} ${d.owner.lastName}` : 'Unassigned',
          wonRevenue: 0,
          dealsCount: 0,
          wonCount: 0,
        };
      }
      if (d.ownerId) repMap[d.ownerId].dealsCount++;

      if (d.stage.isWon) {
        wonCount++;
        totalWonRevenue += amt;
        if (d.ownerId) {
          repMap[d.ownerId].wonRevenue += amt;
          repMap[d.ownerId].wonCount++;
        }
      } else if (d.stage.isLost) {
        lostCount++;
      } else {
        openCount++;
        openPipelineValue += amt;
        weightedForecast += (amt * d.probability) / 100;
      }
    }

    const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;
    const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;
    const winRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;
    const avgDealValue = deals.length > 0 ? (totalWonRevenue + openPipelineValue) / deals.length : 0;

    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate < now && (t.status === 'TODO' || t.status === 'IN_PROGRESS')
    ).length;

    // Lead source distribution
    const sourceMap: { [key: string]: { source: string; total: number; converted: number } } = {};
    for (const l of leads) {
      if (!sourceMap[l.source]) {
        sourceMap[l.source] = { source: l.source, total: 0, converted: 0 };
      }
      sourceMap[l.source].total++;
      if (l.status === 'CONVERTED') sourceMap[l.source].converted++;
    }

    res.json({
      success: true,
      data: {
        summary: {
          period,
          totalRevenue: totalWonRevenue,
          wonDeals: wonCount,
          lostDeals: lostCount,
          openDeals: openCount,
          openPipelineValue,
          weightedForecast: Math.round(weightedForecast),
          winRate: Number(winRate.toFixed(1)),
          totalLeads: leads.length,
          convertedLeads,
          conversionRate: Number(conversionRate.toFixed(1)),
          avgDealValue: Math.round(avgDealValue),
          completedTasks,
          overdueTasks,
        },
        repPerformance: Object.values(repMap),
        sourcePerformance: Object.values(sourceMap),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportDealsCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.organizationId!;

    const deals = await prisma.deal.findMany({
      where: { organizationId: orgId },
      include: {
        stage: true,
        company: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
        owner: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Deal ID',
      'Name',
      'Amount',
      'Currency',
      'Stage',
      'Probability',
      'Company',
      'Contact',
      'Owner',
      'Expected Close Date',
      'Actual Close Date',
      'Created At',
    ];

    const rows = deals.map((d) => [
      sanitizeCsvValue(d.id),
      sanitizeCsvValue(d.name),
      sanitizeCsvValue(d.amount),
      sanitizeCsvValue(d.currency),
      sanitizeCsvValue(d.stage.name),
      sanitizeCsvValue(`${d.probability}%`),
      sanitizeCsvValue(d.company?.name || ''),
      sanitizeCsvValue(d.contact ? `${d.contact.firstName} ${d.contact.lastName}` : ''),
      sanitizeCsvValue(d.owner ? `${d.owner.firstName} ${d.owner.lastName}` : ''),
      sanitizeCsvValue(d.expectedCloseDate ? d.expectedCloseDate.toISOString().split('T')[0] : ''),
      sanitizeCsvValue(d.actualCloseDate ? d.actualCloseDate.toISOString().split('T')[0] : ''),
      sanitizeCsvValue(d.createdAt.toISOString().split('T')[0]),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=clientflow_deals_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const exportLeadsCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.organizationId!;

    const leads = await prisma.lead.findMany({
      where: { organizationId: orgId },
      include: {
        assignedTo: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      'Lead ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Job Title',
      'Source',
      'Status',
      'Priority',
      'Estimated Value',
      'Assigned To',
      'Created At',
    ];

    const rows = leads.map((l) => [
      sanitizeCsvValue(l.id),
      sanitizeCsvValue(l.firstName),
      sanitizeCsvValue(l.lastName),
      sanitizeCsvValue(l.email || ''),
      sanitizeCsvValue(l.phone || ''),
      sanitizeCsvValue(l.companyName || ''),
      sanitizeCsvValue(l.jobTitle || ''),
      sanitizeCsvValue(l.source),
      sanitizeCsvValue(l.status),
      sanitizeCsvValue(l.priority),
      sanitizeCsvValue(l.estimatedValue),
      sanitizeCsvValue(l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : ''),
      sanitizeCsvValue(l.createdAt.toISOString().split('T')[0]),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=clientflow_leads_${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
};
