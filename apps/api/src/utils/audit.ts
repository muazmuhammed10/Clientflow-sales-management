import { prisma } from '../config/db';
import { logger } from '../config/logger';

export interface AuditLogParams {
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const logAudit = async (params: AuditLogParams): Promise<void> => {
  try {
    // Sanitize details to avoid recording passwords or tokens
    const sanitizedDetails = params.details ? { ...params.details } : {};
    delete sanitizedDetails.password;
    delete sanitizedDetails.passwordHash;
    delete sanitizedDetails.token;
    delete sanitizedDetails.tokenHash;

    await prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: sanitizedDetails,
        ipAddress: params.ipAddress,
      },
    });
  } catch (error) {
    logger.error('Failed to write audit log', error);
  }
};
