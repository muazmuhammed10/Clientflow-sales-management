import { Request, Response, NextFunction } from 'express';
import { aiSalesService } from './ai.service';

export const getLeadSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { leadId } = req.params;
    const summary = await aiSalesService.generateLeadSummary(leadId, req.organizationId!);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuggestedFollowUp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { leadId } = req.params;
    const tone = (req.query.tone as any) || 'professional';
    const draft = await aiSalesService.suggestFollowUpEmail(leadId, req.organizationId!, tone);
    res.json({
      success: true,
      data: draft,
    });
  } catch (error) {
    next(error);
  }
};

export const getNextAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, id } = req.params; // type: 'lead' | 'deal'
    if (type !== 'lead' && type !== 'deal') {
      res.status(400).json({ success: false, error: 'Type must be "lead" or "deal"' });
      return;
    }
    const action = await aiSalesService.suggestNextAction(type, id, req.organizationId!);
    res.json({
      success: true,
      data: action,
    });
  } catch (error) {
    next(error);
  }
};
