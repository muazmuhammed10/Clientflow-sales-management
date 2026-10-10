import { z } from 'zod';
import {
  UserRole,
  LeadStatus,
  LeadSource,
  LeadPriority,
  TaskType,
  TaskStatus,
  TaskPriority,
} from './enums';

// Auth Schemas
export const registerSchema = z.object({
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email address is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address is required'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

// Organization Schemas
export const updateOrganizationSchema = z.object({
  name: z.string().min(2).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
});

// Team Member Schemas
export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.nativeEnum(UserRole),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
});

// Lead Schemas
export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  companyName: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  source: z.nativeEnum(LeadSource).default(LeadSource.WEBSITE),
  industry: z.string().optional().or(z.literal('')),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  priority: z.nativeEnum(LeadPriority).default(LeadPriority.MEDIUM),
  estimatedValue: z.number().min(0).optional().default(0),
  expectedCloseDate: z.string().optional().or(z.literal('')),
  assignedToId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  createCompany: z.boolean().default(true),
  companyName: z.string().optional(),
  createContact: z.boolean().default(true),
  createDeal: z.boolean().default(true),
  dealName: z.string().optional(),
  dealAmount: z.number().min(0).optional(),
  dealStageId: z.string().optional(),
  dealExpectedCloseDate: z.string().optional(),
});

// Contact Schemas
export const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
});

export const updateContactSchema = createContactSchema.partial();

// Company Schemas
export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  website: z.string().optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  size: z.string().optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional().default([]),
});

export const updateCompanySchema = createCompanySchema.partial();

// Deal Schemas
export const createDealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().default('USD'),
  stageId: z.string().min(1, 'Pipeline stage is required'),
  pipelineId: z.string().optional(),
  contactId: z.string().optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  ownerId: z.string().optional().or(z.literal('')),
  expectedCloseDate: z.string().optional().or(z.literal('')),
  probability: z.number().min(0).max(100).optional(),
  source: z.nativeEnum(LeadSource).optional().default(LeadSource.OTHER),
  description: z.string().optional().or(z.literal('')),
});

export const updateDealSchema = createDealSchema.partial();

export const updateDealStageSchema = z.object({
  stageId: z.string().min(1, 'Stage ID is required'),
  lossReason: z.string().optional(),
});

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().or(z.literal('')),
  type: z.nativeEnum(TaskType).default(TaskType.GENERAL),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  dueDate: z.string().min(1, 'Due date is required'),
  assignedToId: z.string().optional().or(z.literal('')),
  leadId: z.string().optional().or(z.literal('')),
  contactId: z.string().optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  dealId: z.string().optional().or(z.literal('')),
});

export const updateTaskSchema = createTaskSchema.partial();

// Activity Note Schema
export const createActivityNoteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.string().default('NOTE'),
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  dealId: z.string().optional(),
});
