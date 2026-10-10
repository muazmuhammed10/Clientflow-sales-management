import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

export const globalSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = (req.query.q as string)?.trim() || '';
    if (!q || q.length < 2) {
      res.json({
        success: true,
        data: {
          leads: [],
          contacts: [],
          companies: [],
          deals: [],
        },
      });
      return;
    }

    const orgId = req.organizationId!;

    const [leads, contacts, companies, deals] = await Promise.all([
      prisma.lead.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { companyName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
        },
      }),
      prisma.contact.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { jobTitle: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: { select: { name: true } },
        },
      }),
      prisma.company.findMany({
        where: {
          organizationId: orgId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { industry: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          industry: true,
          city: true,
        },
      }),
      prisma.deal.findMany({
        where: {
          organizationId: orgId,
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: {
          id: true,
          name: true,
          amount: true,
          currency: true,
          stage: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        leads: leads.map((l) => ({
          id: l.id,
          title: `${l.firstName} ${l.lastName}`,
          subtitle: l.companyName || l.status,
          type: 'lead',
          url: `/leads/${l.id}`,
        })),
        contacts: contacts.map((c) => ({
          id: c.id,
          title: `${c.firstName} ${c.lastName}`,
          subtitle: c.company?.name || c.email || '',
          type: 'contact',
          url: `/contacts/${c.id}`,
        })),
        companies: companies.map((comp) => ({
          id: comp.id,
          title: comp.name,
          subtitle: [comp.industry, comp.city].filter(Boolean).join(' • '),
          type: 'company',
          url: `/companies/${comp.id}`,
        })),
        deals: deals.map((d) => ({
          id: d.id,
          title: d.name,
          subtitle: `$${d.amount} • ${d.stage.name}`,
          type: 'deal',
          url: `/deals/${d.id}`,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
