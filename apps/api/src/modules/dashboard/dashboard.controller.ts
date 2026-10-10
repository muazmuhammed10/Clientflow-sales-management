import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

export const getDashboardData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.organizationId!;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Fetch KPI counts and aggregations concurrently
    const [
      totalLeads,
      newLeadsThisMonth,
      convertedLeadsCount,
      totalContacts,
      allDeals,
      pipelineStages,
      leadSourcesGrouped,
      teamMembers,
      recentActivities,
      overdueTasks,
      upcomingTasks,
      recentLeads,
      recentDeals,
    ] = await Promise.all([
      prisma.lead.count({ where: { organizationId: orgId } }),
      prisma.lead.count({
        where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
      }),
      prisma.lead.count({
        where: { organizationId: orgId, status: 'CONVERTED' },
      }),
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.deal.findMany({
        where: { organizationId: orgId },
        include: {
          stage: true,
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.pipelineStage.findMany({
        where: { pipeline: { organizationId: orgId, isDefault: true } },
        orderBy: { order: 'asc' },
      }),
      prisma.lead.groupBy({
        by: ['source'],
        where: { organizationId: orgId },
        _count: { _all: true },
      }),
      prisma.membership.findMany({
        where: { organizationId: orgId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      prisma.activity.findMany({
        where: { organizationId: orgId },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      prisma.task.findMany({
        where: {
          organizationId: orgId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { lt: now },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
      }),
      prisma.task.findMany({
        where: {
          organizationId: orgId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueDate: { gte: now },
        },
        take: 5,
        orderBy: { dueDate: 'asc' },
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
      }),
      prisma.lead.findMany({
        where: { organizationId: orgId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { assignedTo: { select: { firstName: true, lastName: true } } },
      }),
      prisma.deal.findMany({
        where: { organizationId: orgId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          stage: true,
          company: { select: { name: true } },
          owner: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    // 2. Compute Deal Aggregations
    let openDealsCount = 0;
    let wonDealsCount = 0;
    let lostDealsCount = 0;
    let revenueWon = 0;
    let openPipelineValue = 0;
    let weightedPipelineValue = 0;

    // Monthly revenue bucket (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueMap: { [key: string]: { month: string; revenue: number; deals: number } } = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenueMap[key] = {
        month: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        revenue: 0,
        deals: 0,
      };
    }

    // Rep performance bucket
    const repPerformanceMap: {
      [userId: string]: { name: string; wonRevenue: number; wonDeals: number; openDeals: number };
    } = {};

    for (const m of teamMembers) {
      repPerformanceMap[m.user.id] = {
        name: `${m.user.firstName} ${m.user.lastName}`,
        wonRevenue: 0,
        wonDeals: 0,
        openDeals: 0,
      };
    }

    for (const deal of allDeals) {
      const amount = Number(deal.amount);

      if (deal.stage.isWon) {
        wonDealsCount++;
        revenueWon += amount;

        // Bucket to monthly revenue by close date or update date
        const closeDate = deal.actualCloseDate || deal.updatedAt;
        const key = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyRevenueMap[key]) {
          monthlyRevenueMap[key].revenue += amount;
          monthlyRevenueMap[key].deals += 1;
        }

        if (deal.ownerId && repPerformanceMap[deal.ownerId]) {
          repPerformanceMap[deal.ownerId].wonRevenue += amount;
          repPerformanceMap[deal.ownerId].wonDeals += 1;
        }
      } else if (deal.stage.isLost) {
        lostDealsCount++;
      } else {
        openDealsCount++;
        openPipelineValue += amount;
        weightedPipelineValue += (amount * deal.probability) / 100;

        if (deal.ownerId && repPerformanceMap[deal.ownerId]) {
          repPerformanceMap[deal.ownerId].openDeals += 1;
        }
      }
    }

    // Stage Distribution Chart Data
    const stageDistribution = pipelineStages.map((stage) => {
      const stageDeals = allDeals.filter((d) => d.stageId === stage.id);
      const totalAmount = stageDeals.reduce((sum, d) => sum + Number(d.amount), 0);
      return {
        stageId: stage.id,
        stageName: stage.name,
        count: stageDeals.length,
        totalAmount,
        order: stage.order,
      };
    });

    const leadConversionRate =
      totalLeads > 0 ? Number(((convertedLeadsCount / totalLeads) * 100).toFixed(1)) : 0;

    const winRate =
      wonDealsCount + lostDealsCount > 0
        ? Number(((wonDealsCount / (wonDealsCount + lostDealsCount)) * 100).toFixed(1))
        : 0;

    res.json({
      success: true,
      data: {
        kpis: {
          totalLeads,
          newLeadsThisMonth,
          totalContacts,
          openDeals: openDealsCount,
          dealsWon: wonDealsCount,
          dealsLost: lostDealsCount,
          revenueWon,
          openPipelineValue,
          weightedPipelineValue: Math.round(weightedPipelineValue),
          conversionRate: leadConversionRate,
          winRate,
        },
        charts: {
          monthlyRevenue: Object.values(monthlyRevenueMap),
          wonVsLost: [
            { name: 'Won', value: wonDealsCount },
            { name: 'Lost', value: lostDealsCount },
            { name: 'Open', value: openDealsCount },
          ],
          stageDistribution,
          leadSources: leadSourcesGrouped.map((s) => ({
            source: s.source,
            count: s._count._all,
          })),
          repPerformance: Object.values(repPerformanceMap),
        },
        widgets: {
          recentActivities,
          overdueTasks,
          upcomingTasks,
          recentLeads,
          recentDeals,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
