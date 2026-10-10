import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';

export const getDefaultPipeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let pipeline = await prisma.pipeline.findFirst({
      where: { organizationId: req.organizationId, isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: { deals: true },
            },
          },
        },
      },
    });

    // If for some reason not created yet, create it on demand
    if (!pipeline) {
      pipeline = await prisma.$transaction(async (tx) => {
        const p = await tx.pipeline.create({
          data: {
            organizationId: req.organizationId!,
            name: 'Standard Sales Pipeline',
            isDefault: true,
          },
        });

        const defaultStages = [
          { name: 'Qualification', order: 1, probability: 10, isWon: false, isLost: false },
          { name: 'Discovery', order: 2, probability: 30, isWon: false, isLost: false },
          { name: 'Proposal', order: 3, probability: 60, isWon: false, isLost: false },
          { name: 'Negotiation', order: 4, probability: 80, isWon: false, isLost: false },
          { name: 'Closed Won', order: 5, probability: 100, isWon: true, isLost: false },
          { name: 'Closed Lost', order: 6, probability: 0, isWon: false, isLost: true },
        ];

        for (const s of defaultStages) {
          await tx.pipelineStage.create({
            data: {
              pipelineId: p.id,
              name: s.name,
              order: s.order,
              probability: s.probability,
              isWon: s.isWon,
              isLost: s.isLost,
            },
          });
        }

        return tx.pipeline.findUnique({
          where: { id: p.id },
          include: {
            stages: {
              orderBy: { order: 'asc' },
              include: { _count: { select: { deals: true } } },
            },
          },
        });
      });
    }

    res.json({
      success: true,
      data: pipeline,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStageOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stages } = req.body; // Array of { id: string, order: number }

    if (!Array.isArray(stages)) {
      res.status(400).json({ success: false, error: 'stages array is required' });
      return;
    }

    await prisma.$transaction(
      stages.map((st) =>
        prisma.pipelineStage.update({
          where: { id: st.id },
          data: { order: st.order },
        })
      )
    );

    res.json({
      success: true,
      message: 'Pipeline stage order updated successfully',
    });
  } catch (error) {
    next(error);
  }
};
