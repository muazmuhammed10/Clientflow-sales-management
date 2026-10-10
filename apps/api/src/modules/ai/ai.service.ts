import { prisma } from '../../config/db';

export class AiSalesService {
  /**
   * Generates a structured executive summary of a lead based on notes and interactions.
   */
  async generateLeadSummary(leadId: string, orgId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId },
      include: {
        activities: { orderBy: { createdAt: 'desc' }, take: 5 },
        tasks: { orderBy: { dueDate: 'asc' }, take: 5 },
      },
    });

    if (!lead) throw new Error('Lead not found');

    const activityCount = lead.activities.length;
    const taskCount = lead.tasks.length;
    const recentNote = lead.activities.find((a) => a.type === 'NOTE')?.description || lead.notes || 'No notes logged yet.';

    const highlights: string[] = [
      `Source: Acquired via ${lead.source.replace(/_/g, ' ').toLowerCase()}.`,
      `Qualification: Currently in ${lead.status} stage with ${lead.priority} priority.`,
      lead.estimatedValue && Number(lead.estimatedValue) > 0
        ? `Estimated Opportunity Value: $${lead.estimatedValue}.`
        : 'Opportunity value not yet quantified.',
      `Engagement: ${activityCount} documented interaction(s) and ${taskCount} scheduled task(s).`,
    ];

    let sentiment = 'Neutral';
    if (lead.status === 'QUALIFIED' || lead.priority === 'HIGH') {
      sentiment = 'High Intent / Positive';
    } else if (lead.status === 'UNQUALIFIED') {
      sentiment = 'Low Fit / Re-evaluating';
    }

    const summaryText = `${lead.firstName} ${lead.lastName} (${lead.jobTitle || 'Decision Maker'} at ${
      lead.companyName || 'prospective company'
    }) was acquired through ${lead.source.replace(/_/g, ' ').toLowerCase()}. Current status is ${
      lead.status
    } with ${lead.priority.toLowerCase()} priority. Recent engagement context: "${recentNote.slice(0, 150)}".`;

    return {
      leadId: lead.id,
      leadName: `${lead.firstName} ${lead.lastName}`,
      companyName: lead.companyName,
      status: lead.status,
      sentiment,
      summary: summaryText,
      keyHighlights: highlights,
      recommendedNextSteps: [
        'Schedule discovery alignment call with primary stakeholders.',
        'Validate target budget timeline and procurement milestones.',
        'Send personalized product walkthrough deck highlighting specific business pain points.',
      ],
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Suggests personalized follow-up email drafts based on tone.
   */
  async suggestFollowUpEmail(leadId: string, orgId: string, tone: 'professional' | 'consultative' | 'urgent' = 'professional') {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: orgId },
    });

    if (!lead) throw new Error('Lead not found');

    const company = lead.companyName ? ` at ${lead.companyName}` : '';
    let subject = '';
    let body = '';

    if (tone === 'urgent') {
      subject = `Time-sensitive: Advancing your sales pipeline with ClientFlow`;
      body = `Hi ${lead.firstName},\n\nI wanted to quickly follow up regarding our earlier discussion on optimizing operations${company}.\n\nGiven the current quarter objectives we touched on, I would love to reserve 15 minutes this Thursday or Friday to ensure you have everything needed to make a seamless decision.\n\nCould 10:00 AM on Thursday work for a quick check-in?\n\nBest regards,\n[Your Name]`;
    } else if (tone === 'consultative') {
      subject = `Ideas to accelerate sales efficiency for ${lead.companyName || lead.firstName}`;
      body = `Hi ${lead.firstName},\n\nHope your week is off to a productive start.\n\nFollowing up on our conversation regarding your current sales workflow${company}, I put together a few thoughts on how ClientFlow could help automate pipeline stages and improve conversion rates.\n\nWould you be open to a brief 20-minute discussion early next week to explore if this aligns with your team's goals?\n\nLooking forward to hearing your thoughts,\n[Your Name]`;
    } else {
      // Professional default
      subject = `Following up - Next steps for ${lead.companyName || 'your team'}`;
      body = `Hi ${lead.firstName},\n\nThank you for connecting with us regarding ClientFlow. I am following up to see if you have any questions regarding how we support sales pipelines and CRM automation${company}.\n\nI would be delighted to coordinate a tailored demo for your team at your earliest convenience.\n\nPlease let me know what day and time works best for your schedule.\n\nBest regards,\n[Your Name]`;
    }

    return {
      leadId: lead.id,
      tone,
      subject,
      body,
      recipient: lead.email || '',
      generatedAt: new Date().toISOString(),
      disclaimer: 'AI-Generated draft. Please review and customize before sending.',
    };
  }

  /**
   * Recommends next best action for a deal or lead.
   */
  async suggestNextAction(entityType: 'lead' | 'deal', entityId: string, orgId: string) {
    if (entityType === 'deal') {
      const deal = await prisma.deal.findFirst({
        where: { id: entityId, organizationId: orgId },
        include: { stage: true, tasks: { where: { status: { in: ['TODO', 'IN_PROGRESS'] } } } },
      });
      if (!deal) throw new Error('Deal not found');

      let action = 'Schedule executive proposal review';
      let rationale = 'Deal has progressed through discovery without an active blocker.';
      let priority = 'HIGH';

      if (deal.tasks.length === 0) {
        action = 'Create immediate follow-up task';
        rationale = 'This deal currently has no pending tasks or next steps assigned.';
        priority = 'URGENT';
      } else if (deal.stage.isWon) {
        action = 'Initiate customer onboarding workflow';
        rationale = 'Deal is Closed Won! Hand off to customer success team.';
        priority = 'HIGH';
      }

      return {
        entityType,
        entityId,
        recommendedAction: action,
        rationale,
        priority,
        suggestedDueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      };
    } else {
      const lead = await prisma.lead.findFirst({
        where: { id: entityId, organizationId: orgId },
      });
      if (!lead) throw new Error('Lead not found');

      return {
        entityType: 'lead',
        entityId,
        recommendedAction:
          lead.status === 'NEW'
            ? 'Initial outreach call & intro email'
            : lead.status === 'CONTACTED'
            ? 'Discovery qualification meeting'
            : 'Convert lead to active opportunity',
        rationale: `Lead is currently in ${lead.status} status. Prompt action increases conversion velocity.`,
        priority: lead.priority === 'HIGH' ? 'URGENT' : 'MEDIUM',
        suggestedDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
    }
  }
}

export const aiSalesService = new AiSalesService();
