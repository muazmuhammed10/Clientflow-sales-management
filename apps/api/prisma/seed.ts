import { PrismaClient, Role, LeadStatus, LeadSource, Priority, TaskType, TaskStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting ClientFlow database seeding...');

  // 1. Clean existing records in development (safe cleanup in order)
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.task.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log('🧹 Cleaned existing database state.');

  // 2. Create Sample Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Apex Enterprises',
      slug: 'apex-enterprises',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  });

  // 3. Create Pipeline & Stages
  const pipeline = await prisma.pipeline.create({
    data: {
      organizationId: org.id,
      name: 'Standard B2B Pipeline',
      isDefault: true,
    },
  });

  const stagesData = [
    { name: 'Qualification', order: 1, probability: 10, isWon: false, isLost: false },
    { name: 'Discovery', order: 2, probability: 30, isWon: false, isLost: false },
    { name: 'Proposal', order: 3, probability: 60, isWon: false, isLost: false },
    { name: 'Negotiation', order: 4, probability: 80, isWon: false, isLost: false },
    { name: 'Closed Won', order: 5, probability: 100, isWon: true, isLost: false },
    { name: 'Closed Lost', order: 6, probability: 0, isWon: false, isLost: true },
  ];

  const stages: Record<string, any> = {};
  for (const s of stagesData) {
    const createdStage = await prisma.pipelineStage.create({
      data: {
        pipelineId: pipeline.id,
        name: s.name,
        order: s.order,
        probability: s.probability,
        isWon: s.isWon,
        isLost: s.isLost,
      },
    });
    stages[s.name] = createdStage;
  }

  // 4. Create Demo Users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const usersData = [
    {
      email: 'admin@apex.com',
      firstName: 'Alex',
      lastName: 'Morgan',
      role: Role.ORG_ADMIN,
      phone: '+1 (555) 101-2001',
    },
    {
      email: 'manager@apex.com',
      firstName: 'Marcus',
      lastName: 'Vance',
      role: Role.SALES_MANAGER,
      phone: '+1 (555) 101-2002',
    },
    {
      email: 'rep.sarah@apex.com',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: Role.SALES_REP,
      phone: '+1 (555) 101-2003',
    },
    {
      email: 'rep.david@apex.com',
      firstName: 'David',
      lastName: 'Chen',
      role: Role.SALES_REP,
      phone: '+1 (555) 101-2004',
    },
    {
      email: 'analyst@apex.com',
      firstName: 'Rachel',
      lastName: 'Kim',
      role: Role.READ_ONLY_ANALYST,
      phone: '+1 (555) 101-2005',
    },
  ];

  const users: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        isActive: true,
      },
    });

    await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: org.id,
        role: u.role,
      },
    });

    users[u.email] = user;
  }

  console.log('👤 Created demo accounts with password "Password123!".');

  // 5. Create Companies
  const companiesData = [
    {
      name: 'CloudScale Technologies',
      website: 'https://cloudscale.io',
      industry: 'Software & Cloud',
      size: '250-500 employees',
      email: 'info@cloudscale.io',
      city: 'Austin',
      country: 'USA',
      ownerId: users['rep.sarah@apex.com'].id,
    },
    {
      name: 'FinEdge Capital Partners',
      website: 'https://finedge.com',
      industry: 'Financial Services',
      size: '100-250 employees',
      email: 'contact@finedge.com',
      city: 'New York',
      country: 'USA',
      ownerId: users['rep.david@apex.com'].id,
    },
    {
      name: 'BlueSky Logistics',
      website: 'https://blueskylogistics.com',
      industry: 'Logistics & Supply Chain',
      size: '500+ employees',
      email: 'ops@blueskylogistics.com',
      city: 'Chicago',
      country: 'USA',
      ownerId: users['rep.sarah@apex.com'].id,
    },
    {
      name: 'Medix Health Systems',
      website: 'https://medixhealth.org',
      industry: 'Healthcare Technology',
      size: '1000+ employees',
      email: 'inquiries@medixhealth.org',
      city: 'Boston',
      country: 'USA',
      ownerId: users['manager@apex.com'].id,
    },
    {
      name: 'Vertex AI Labs',
      website: 'https://vertexai.ai',
      industry: 'Artificial Intelligence',
      size: '50-100 employees',
      email: 'hello@vertexai.ai',
      city: 'San Francisco',
      country: 'USA',
      ownerId: users['rep.david@apex.com'].id,
    },
    {
      name: 'Horizon Retail Brands',
      website: 'https://horizonretail.com',
      industry: 'E-commerce & Retail',
      size: '500-1000 employees',
      email: 'partnerships@horizonretail.com',
      city: 'Seattle',
      country: 'USA',
      ownerId: users['rep.sarah@apex.com'].id,
    },
  ];

  const companies: Record<string, any> = {};
  for (const c of companiesData) {
    const comp = await prisma.company.create({
      data: {
        organizationId: org.id,
        name: c.name,
        website: c.website,
        industry: c.industry,
        size: c.size,
        email: c.email,
        city: c.city,
        country: c.country,
        ownerId: c.ownerId,
        tags: ['Enterprise', 'Target Account'],
      },
    });
    companies[c.name] = comp;
  }

  // 6. Create Contacts
  const contactsData = [
    {
      firstName: 'Jonathan',
      lastName: 'Reeves',
      email: 'jreeves@cloudscale.io',
      phone: '+1 (512) 889-1022',
      jobTitle: 'VP of Engineering',
      companyId: companies['CloudScale Technologies'].id,
      ownerId: users['rep.sarah@apex.com'].id,
    },
    {
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'erostova@finedge.com',
      phone: '+1 (212) 441-9980',
      jobTitle: 'Chief Risk Officer',
      companyId: companies['FinEdge Capital Partners'].id,
      ownerId: users['rep.david@apex.com'].id,
    },
    {
      firstName: 'Robert',
      lastName: 'Sterling',
      email: 'rsterling@blueskylogistics.com',
      phone: '+1 (312) 774-2390',
      jobTitle: 'Director of Global Fleet Operations',
      companyId: companies['BlueSky Logistics'].id,
      ownerId: users['rep.sarah@apex.com'].id,
    },
    {
      firstName: 'Dr. Evelyn',
      lastName: 'Carter',
      email: 'ecarter@medixhealth.org',
      phone: '+1 (617) 552-8811',
      jobTitle: 'Head of Clinical IT',
      companyId: companies['Medix Health Systems'].id,
      ownerId: users['manager@apex.com'].id,
    },
    {
      firstName: 'Liam',
      lastName: 'Zhao',
      email: 'lzhao@vertexai.ai',
      phone: '+1 (415) 302-8844',
      jobTitle: 'CTO & Co-founder',
      companyId: companies['Vertex AI Labs'].id,
      ownerId: users['rep.david@apex.com'].id,
    },
    {
      firstName: 'Sophia',
      lastName: 'Patel',
      email: 'spatel@horizonretail.com',
      phone: '+1 (206) 919-4500',
      jobTitle: 'SVP of Digital Transformation',
      companyId: companies['Horizon Retail Brands'].id,
      ownerId: users['rep.sarah@apex.com'].id,
    },
  ];

  const contacts: Record<string, any> = {};
  for (const ct of contactsData) {
    const contact = await prisma.contact.create({
      data: {
        organizationId: org.id,
        firstName: ct.firstName,
        lastName: ct.lastName,
        email: ct.email,
        phone: ct.phone,
        jobTitle: ct.jobTitle,
        companyId: ct.companyId,
        ownerId: ct.ownerId,
        notes: `Key decision maker for enterprise procurement.`,
        tags: ['Key Stakeholder'],
        lastInteractionAt: new Date(),
      },
    });
    contacts[`${ct.firstName} ${ct.lastName}`] = contact;
  }

  // 7. Create Leads across various statuses
  const leadsData = [
    {
      firstName: 'Claire',
      lastName: 'Underwood',
      email: 'claire.u@nexussolutions.io',
      phone: '+1 (415) 662-1100',
      companyName: 'Nexus Solutions',
      jobTitle: 'Head of Sales Operations',
      source: LeadSource.WEBSITE,
      status: LeadStatus.QUALIFIED,
      priority: Priority.HIGH,
      estimatedValue: 75000,
      assignedToId: users['rep.sarah@apex.com'].id,
      notes: 'Requested product demo for 40-seat sales team. Evaluating Q4 rollout.',
    },
    {
      firstName: 'Gregory',
      lastName: 'House',
      email: 'ghouse@diagnosticsplus.com',
      phone: '+1 (609) 332-9011',
      companyName: 'Diagnostics Plus',
      jobTitle: 'Operations Director',
      source: LeadSource.REFERRAL,
      status: LeadStatus.CONTACTED,
      priority: Priority.MEDIUM,
      estimatedValue: 45000,
      assignedToId: users['rep.david@apex.com'].id,
      notes: 'Initial outreach call completed. Requested compliance paperwork.',
    },
    {
      firstName: 'Samantha',
      lastName: 'Miller',
      email: 'smiller@greenpeak.org',
      phone: '+1 (303) 441-2980',
      companyName: 'GreenPeak Energy',
      jobTitle: 'Director of Business Development',
      source: LeadSource.SOCIAL_MEDIA,
      status: LeadStatus.NEW,
      priority: Priority.HIGH,
      estimatedValue: 60000,
      assignedToId: users['rep.sarah@apex.com'].id,
      notes: 'Inbound lead via LinkedIn enterprise campaign.',
    },
    {
      firstName: 'Michael',
      lastName: 'Chang',
      email: 'mchang@novastart.io',
      phone: '+1 (408) 551-7711',
      companyName: 'NovaStart Incubator',
      jobTitle: 'Founder & Managing Partner',
      source: LeadSource.EVENT,
      status: LeadStatus.NEW,
      priority: Priority.MEDIUM,
      estimatedValue: 30000,
      assignedToId: users['rep.david@apex.com'].id,
      notes: 'Met at SaaStr Annual 2026 conference.',
    },
    {
      firstName: 'Valerie',
      lastName: 'Torres',
      email: 'vtorres@legacyretail.com',
      phone: '+1 (305) 882-9901',
      companyName: 'Legacy Retail Group',
      jobTitle: 'IT Procurement Lead',
      source: LeadSource.COLD_OUTREACH,
      status: LeadStatus.UNQUALIFIED,
      priority: Priority.LOW,
      estimatedValue: 15000,
      assignedToId: users['rep.sarah@apex.com'].id,
      notes: 'Budget postponed indefinitely until FY2027.',
    },
    {
      firstName: 'Arthur',
      lastName: 'Dent',
      email: 'adent@galacticfreight.com',
      phone: '+1 (44) 20 7946 0991',
      companyName: 'Galactic Freight UK',
      jobTitle: 'Logistics Coordinator',
      source: LeadSource.EMAIL_CAMPAIGN,
      status: LeadStatus.CONVERTED,
      priority: Priority.HIGH,
      estimatedValue: 95000,
      assignedToId: users['rep.david@apex.com'].id,
      notes: 'Converted successfully to active customer account.',
    },
  ];

  for (const ld of leadsData) {
    await prisma.lead.create({
      data: {
        organizationId: org.id,
        firstName: ld.firstName,
        lastName: ld.lastName,
        email: ld.email,
        phone: ld.phone,
        companyName: ld.companyName,
        jobTitle: ld.jobTitle,
        source: ld.source,
        status: ld.status,
        priority: ld.priority,
        estimatedValue: ld.estimatedValue,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        assignedToId: ld.assignedToId,
        createdById: users['admin@apex.com'].id,
        notes: ld.notes,
        tags: ['Inbound', 'Mid-Market'],
        convertedAt: ld.status === LeadStatus.CONVERTED ? new Date() : null,
      },
    });
  }

  // 8. Create Realistic Deals across stages
  const dealsData = [
    {
      name: 'CloudScale - Enterprise Cloud CRM Expansion',
      company: companies['CloudScale Technologies'],
      contact: contacts['Jonathan Reeves'],
      stage: stages['Closed Won'],
      amount: 145000,
      ownerId: users['rep.sarah@apex.com'].id,
      probability: 100,
      actualCloseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'FinEdge - Risk Analytics CRM Integration',
      company: companies['FinEdge Capital Partners'],
      contact: contacts['Elena Rostova'],
      stage: stages['Closed Won'],
      amount: 180000,
      ownerId: users['rep.david@apex.com'].id,
      probability: 100,
      actualCloseDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'BlueSky - Fleet Tracking Sales Suite',
      company: companies['BlueSky Logistics'],
      contact: contacts['Robert Sterling'],
      stage: stages['Negotiation'],
      amount: 110000,
      ownerId: users['rep.sarah@apex.com'].id,
      probability: 80,
      expectedCloseDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Medix - Healthcare Provider Portal Suite',
      company: companies['Medix Health Systems'],
      contact: contacts['Dr. Evelyn Carter'],
      stage: stages['Proposal'],
      amount: 220000,
      ownerId: users['manager@apex.com'].id,
      probability: 60,
      expectedCloseDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Vertex AI - Sales Automation Infrastructure',
      company: companies['Vertex AI Labs'],
      contact: contacts['Liam Zhao'],
      stage: stages['Discovery'],
      amount: 85000,
      ownerId: users['rep.david@apex.com'].id,
      probability: 30,
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Horizon Retail - Omnichannel CRM Pipeline',
      company: companies['Horizon Retail Brands'],
      contact: contacts['Sophia Patel'],
      stage: stages['Qualification'],
      amount: 65000,
      ownerId: users['rep.sarah@apex.com'].id,
      probability: 10,
      expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      name: 'Legacy Retail - Custom Integration Pilot',
      company: companies['Horizon Retail Brands'],
      contact: contacts['Sophia Patel'],
      stage: stages['Closed Lost'],
      amount: 50000,
      ownerId: users['rep.david@apex.com'].id,
      probability: 0,
      actualCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      lossReason: 'Competitor offering bundle discount on existing ERP contract.',
    },
  ];

  const createdDeals: any[] = [];
  for (const d of dealsData) {
    const deal = await prisma.deal.create({
      data: {
        organizationId: org.id,
        name: d.name,
        pipelineId: pipeline.id,
        stageId: d.stage.id,
        companyId: d.company.id,
        contactId: d.contact.id,
        amount: d.amount,
        currency: 'USD',
        probability: d.probability,
        ownerId: d.ownerId,
        actualCloseDate: d.actualCloseDate || null,
        expectedCloseDate: d.expectedCloseDate || null,
        lossReason: d.lossReason || null,
        source: LeadSource.WEBSITE,
        description: 'Strategic B2B relationship deal in standard sales pipeline.',
      },
    });
    createdDeals.push(deal);
  }

  // 9. Create Tasks (Due today, overdue, upcoming, completed)
  const tasksData = [
    {
      title: 'Sign and execute Master Services Agreement',
      type: TaskType.FOLLOW_UP,
      priority: Priority.URGENT,
      status: TaskStatus.TODO,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue!
      assignedToId: users['rep.sarah@apex.com'].id,
      companyId: companies['BlueSky Logistics'].id,
      dealId: createdDeals[2].id,
    },
    {
      title: 'Review HIPAA compliance appendix with Legal',
      type: TaskType.MEETING,
      priority: Priority.HIGH,
      status: TaskStatus.IN_PROGRESS,
      dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // Due Today!
      assignedToId: users['manager@apex.com'].id,
      companyId: companies['Medix Health Systems'].id,
      dealId: createdDeals[3].id,
    },
    {
      title: 'Prepare product architecture benchmark slide deck',
      type: TaskType.GENERAL,
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Upcoming
      assignedToId: users['rep.david@apex.com'].id,
      companyId: companies['Vertex AI Labs'].id,
      dealId: createdDeals[4].id,
    },
    {
      title: 'Conduct executive debrief call with Jonathan',
      type: TaskType.CALL,
      priority: Priority.MEDIUM,
      status: TaskStatus.COMPLETED,
      dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      assignedToId: users['rep.sarah@apex.com'].id,
      companyId: companies['CloudScale Technologies'].id,
      dealId: createdDeals[0].id,
    },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        title: t.title,
        type: t.type,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        assignedToId: t.assignedToId,
        createdById: users['admin@apex.com'].id,
        companyId: t.companyId,
        dealId: t.dealId,
        completedAt: t.completedAt || null,
      },
    });
  }

  // 10. Create Activity Feed
  await prisma.activity.createMany({
    data: [
      {
        organizationId: org.id,
        userId: users['rep.sarah@apex.com'].id,
        dealId: createdDeals[0].id,
        companyId: companies['CloudScale Technologies'].id,
        type: 'DEAL_WON',
        title: 'Deal Closed Won! 🎉',
        description: 'Successfully signed 2-year enterprise software contract for $145,000.',
      },
      {
        organizationId: org.id,
        userId: users['rep.david@apex.com'].id,
        dealId: createdDeals[1].id,
        companyId: companies['FinEdge Capital Partners'].id,
        type: 'DEAL_WON',
        title: 'Deal Closed Won! 🎉',
        description: 'FinEdge Capital contract countersigned for $180,000.',
      },
      {
        organizationId: org.id,
        userId: users['rep.sarah@apex.com'].id,
        dealId: createdDeals[2].id,
        companyId: companies['BlueSky Logistics'].id,
        type: 'STAGE_CHANGE',
        title: 'Moved to Negotiation',
        description: 'Contract terms delivered to VP of Procurement.',
      },
      {
        organizationId: org.id,
        userId: users['manager@apex.com'].id,
        dealId: createdDeals[3].id,
        companyId: companies['Medix Health Systems'].id,
        type: 'MEETING',
        title: 'Clinical Architecture Review',
        description: 'Completed comprehensive 60-minute review with Dr. Evelyn Carter.',
      },
    ],
  });

  // 11. Create In-App Notifications
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        userId: users['rep.sarah@apex.com'].id,
        type: 'DEAL_WON',
        title: 'Congratulations! Deal Won 🎉',
        message: 'CloudScale Technologies ($145,000) was marked as Closed Won.',
        link: `/deals/${createdDeals[0].id}`,
        isRead: false,
      },
      {
        organizationId: org.id,
        userId: users['rep.sarah@apex.com'].id,
        type: 'TASK_OVERDUE',
        title: 'Overdue Task Reminder',
        message: 'Task "Sign and execute Master Services Agreement" is past due.',
        link: '/tasks',
        isRead: false,
      },
      {
        organizationId: org.id,
        userId: users['manager@apex.com'].id,
        type: 'LEAD_ASSIGNED',
        title: 'High Priority Lead Received',
        message: 'Claire Underwood (Nexus Solutions) is in Qualified status.',
        link: '/leads',
        isRead: false,
      },
    ],
  });

  console.log('✅ ClientFlow database successfully seeded with comprehensive B2B demo data!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
