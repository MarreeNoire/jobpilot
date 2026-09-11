import { z } from 'zod';

// User validation schemas
export const userRoleSchema = z.enum(['CANDIDATE', 'RECRUITER', 'ADMIN']);

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  role: userRoleSchema,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Profile validation schemas
export const profileSchema = z.object({
  title: z.string().optional(),
  professionalSummary: z.string().optional(),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  availability: z.string().optional(),
});

// Experience validation schema
export const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  startDate: z.date(),
  endDate: z.date().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

// Education validation schema
export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
});

// Skill validation schema
export const skillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  level: z.number().int().min(1).max(5).optional(), // Assuming level 1-5
});

// Job preference validation schema
export const jobPreferenceSchema = z.object({
  jobTitles: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
  remote: z.boolean().default(false),
  minSalary: z.number().int().nonnegative().optional(),
  contractTypes: z.array(z.string()).default([]),
  industries: z.array(z.string()).default([]),
});

// Resume validation schema
export const resumeSchema = z.object({
  title: z.string().min(1, 'Resume title is required'),
  fileUrl: z.string().url('Invalid URL').optional(),
  fileName: z.string().optional(),
  fileMimeType: z.string().optional(),
  fileContent: z.string().optional(),
  isPrimary: z.boolean().default(false),
}).refine(
  (data) => Boolean(data.fileUrl) || Boolean(data.fileContent),
  {
    message: 'Provide either a file URL or upload a file',
    path: ['fileUrl'],
  }
);

// Cover letter validation schema
export const coverLetterSchema = z.object({
  title: z.string().min(1, 'Cover letter title is required'),
  content: z.string().min(1, 'Cover letter content is required'),
  isPrimary: z.boolean().default(false),
});

// Job validation schema
export const jobStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED']);

export const jobSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  platformId: z.string().min(1, 'Platform ID is required'),
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  url: z.string().url('Invalid URL'),
});

// Application validation schema
const applicationStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'PROCESSING',
  'WAITING_USER',
  'SUBMITTED',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'FAILED',
  'REJECTED',
  'INTERVIEW',
  'ACCEPTED'
]);

export const applicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  resumeId: z.string().optional(),
  coverLetterId: z.string().optional(),
  status: applicationStatusSchema.default('DRAFT'),
  compatibilityScore: z.number().min(0).max(100).optional(),
});

// Le champ "message" est optionnel : il permet au recruteur de personnaliser
// la notification envoyee au candidat lors du changement de statut
// (par ex. lors d'une convocation a un entretien ou d'un refus).
export const updateApplicationStatusSchema = z.object({
  status: applicationStatusSchema,
  message: z.string().max(2000).optional(),
});

// Note interne recruteur, jamais exposee au candidat.
export const updateApplicationRecruiterNoteSchema = z.object({
  recruiterNotes: z.string().max(5000, 'La note est trop longue (5000 caracteres max)'),
});

export const createInterviewSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }),
  timezone: z.string().min(1).max(100),
  mode: z.enum(['VIDEO', 'PHONE', 'ONSITE']),
  meetingUrl: z.string().url().max(2000).optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
});

// Validation d'une candidature : le recruteur doit joindre une promesse
// d'embauche / un message de confirmation destine au candidat.
export const acceptApplicationSchema = z.object({
  hiringMessage: z
    .string()
    .min(1, "Un message de confirmation ou une promesse d'embauche est requis")
    .max(5000, 'Le message est trop long (5000 caracteres max)'),
});

export const updateJobStatusSchema = z.object({
  status: jobStatusSchema,
});
