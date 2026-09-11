// AI Provider Types
export interface AnalyzeJobInput {
  title: string;
  company: string;
  description: string;
  location?: string;
  salary?: string;
  url?: string;
  platform?: string;
}

export interface JobAnalysis {
  summary?: string;
  requiredSkills: string[];
  desiredSkills: string[];
  requiredExperience?: string;
  requiredEducation?: string;
  contractType?: string;
  location?: string;
  responsibilities?: string[];
  keywords?: string[];
  eliminationCriteria?: string[];
  compatibilityScore?: number; // 0-100
  strengths?: string[];
  weaknesses?: string[];
  recommendation?: string;
}

export interface MatchInput {
  userProfile: any; // Would be more specific in a real implementation
  resume: any;
  jobAnalysis: JobAnalysis;
}

export interface MatchResult {
  score: number; // 0-100
  details: string[];
}

export interface CoverLetterInput {
  userProfile: any;
  resume: any;
  jobAnalysis: JobAnalysis;
  companyName?: string;
  positionTitle?: string;
}

export interface ApplicationQuestionInput {
  question: string;
  userProfile: any;
  resume: any;
  coverLetter?: string;
  jobAnalysis?: JobAnalysis;
}

// AI Provider abstraction
export interface AIProvider {
  analyzeJob(input: AnalyzeJobInput): Promise<JobAnalysis>;
  calculateMatch(input: MatchInput): Promise<MatchResult>;
  generateCoverLetter(input: CoverLetterInput): Promise<string>;
  answerApplicationQuestion(
    input: ApplicationQuestionInput
  ): Promise<string>;
}