import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../config/db';

const app = createApp();

describe('ClientFlow Enterprise API Test Suite', () => {
  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let orgALeadId: string;
  let orgADealId: string;
  let orgAQualificationStageId: string;
  let orgAWonStageId: string;

  beforeAll(async () => {
    // Clean test state
    try {
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
      await prisma.refreshToken.deleteMany();
      await prisma.passwordResetToken.deleteMany();
      await prisma.user.deleteMany();
      await prisma.organization.deleteMany();
    } catch (e) {
      // Ignore if db is empty
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Health Check', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('ClientFlow API');
    });
  });

  describe('2. Authentication & Tenant Isolation', () => {
    it('should register Organization A and create admin user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          organizationName: 'Alpha Corp',
          firstName: 'Alice',
          lastName: 'Admin',
          email: 'alice@alpha.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('alice@alpha.com');
      expect(res.body.data.user.role).toBe('ORG_ADMIN');

      orgAAdminToken = res.body.data.accessToken;
    });

    it('should register Organization B and create another admin user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          organizationName: 'Beta LLC',
          firstName: 'Bob',
          lastName: 'Beta',
          email: 'bob@beta.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      orgBAdminToken = res.body.data.accessToken;
    });

    it('should reject login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@alpha.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alice@alpha.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('3. Leads CRUD & Cross-Tenant Security', () => {
    it('should create a lead under Organization A', async () => {
      const res = await request(app)
        .post('/api/v1/leads')
        .set('Authorization', `Bearer ${orgAAdminToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'johndoe@example.com',
          phone: '+1-555-0199',
          companyName: 'Acme Solutions',
          jobTitle: 'VP of Technology',
          source: 'WEBSITE',
          status: 'QUALIFIED',
          priority: 'HIGH',
          estimatedValue: 50000,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('John');
      expect(res.body.data.status).toBe('QUALIFIED');
      orgALeadId = res.body.data.id;
    });

    it('should PREVENT Organization B user from accessing Organization A lead (Tenant Isolation)', async () => {
      const res = await request(app)
        .get(`/api/v1/leads/${orgALeadId}`)
        .set('Authorization', `Bearer ${orgBAdminToken}`);

      // Must return 404 Not Found to prevent data leakage between tenants
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should PREVENT Organization B user from deleting Organization A lead', async () => {
      const res = await request(app)
        .delete(`/api/v1/leads/${orgALeadId}`)
        .set('Authorization', `Bearer ${orgBAdminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('4. Atomic Lead Conversion Workflow', () => {
    it('should convert lead into Company, Contact, and Deal in a single atomic transaction', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${orgALeadId}/convert`)
        .set('Authorization', `Bearer ${orgAAdminToken}`)
        .send({
          createCompany: true,
          companyName: 'Acme Solutions International',
          createContact: true,
          createDeal: true,
          dealName: 'Acme Global Enterprise Agreement',
          dealAmount: 75000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lead.status).toBe('CONVERTED');
      expect(res.body.data.companyId).toBeDefined();
      expect(res.body.data.contactId).toBeDefined();
      expect(res.body.data.dealId).toBeDefined();

      orgADealId = res.body.data.dealId;
    });

    it('should reject duplicate conversion of an already-converted lead', async () => {
      const res = await request(app)
        .post(`/api/v1/leads/${orgALeadId}/convert`)
        .set('Authorization', `Bearer ${orgAAdminToken}`)
        .send({
          createCompany: true,
          createContact: true,
          createDeal: true,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already been converted');
    });
  });

  describe('5. Sales Pipeline, Stage Movement & Realized Revenue', () => {
    it('should fetch default pipeline and stages for Org A', async () => {
      const res = await request(app)
        .get('/api/v1/pipelines')
        .set('Authorization', `Bearer ${orgAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stages.length).toBeGreaterThanOrEqual(6);

      const qual = res.body.data.stages.find((s: any) => s.name === 'Qualification');
      const won = res.body.data.stages.find((s: any) => s.isWon);

      orgAQualificationStageId = qual.id;
      orgAWonStageId = won.id;
    });

    it('should move deal to Closed Won and set probability to 100%', async () => {
      const res = await request(app)
        .patch(`/api/v1/deals/${orgADealId}/stage`)
        .set('Authorization', `Bearer ${orgAAdminToken}`)
        .send({
          stageId: orgAWonStageId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.stageId).toBe(orgAWonStageId);
      expect(res.body.data.probability).toBe(100);
      expect(res.body.data.actualCloseDate).toBeDefined();
    });

    it('should verify Dashboard reflects won revenue from real database calculation', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${orgAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.kpis.revenueWon).toBe(75000);
      expect(res.body.data.kpis.dealsWon).toBe(1);
    });
  });

  describe('6. Tasks, Follow-ups and Activities', () => {
    let taskId: string;

    it('should create task linked to deal', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${orgAAdminToken}`)
        .send({
          title: 'Countersign Service Level Agreement',
          type: 'FOLLOW_UP',
          priority: 'URGENT',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          dealId: orgADealId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Countersign Service Level Agreement');
      taskId = res.body.data.id;
    });

    it('should mark task as completed', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${orgAAdminToken}`)
        .send({
          status: 'COMPLETED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).toBeDefined();
    });
  });

  describe('7. AI Sales Assistant API', () => {
    it('should generate intelligent lead summary without external API key dependency', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/lead-summary/${orgALeadId}`)
        .set('Authorization', `Bearer ${orgAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.summary).toBeDefined();
      expect(res.body.data.keyHighlights.length).toBeGreaterThan(0);
    });

    it('should generate tailored follow-up email draft', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/suggest-followup/${orgALeadId}?tone=consultative`)
        .set('Authorization', `Bearer ${orgAAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.subject).toBeDefined();
      expect(res.body.data.body).toBeDefined();
      expect(res.body.data.disclaimer).toBeDefined();
    });
  });
});
