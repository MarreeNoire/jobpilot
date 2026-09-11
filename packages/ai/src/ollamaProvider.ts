import { AIProvider, AnalyzeJobInput, JobAnalysis, MatchInput, MatchResult, CoverLetterInput, ApplicationQuestionInput } from './types';
import { z } from 'zod';

// Ollama provider implementation
export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  // Validate and parse the structured output from Ollama
  private async parseStructuredOutput<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
          format: 'json', // Request JSON output format
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const parsed = schema.parse(JSON.parse(data.response));
      return parsed;
    } catch (error) {
      console.error('Error parsing Ollama output:', error);
      // Return a default/fallback value based on the schema
      // In a real implementation, you might want to handle this more gracefully
      throw error;
    }
  }

  async analyzeJob(input: AnalyzeJobInput): Promise<JobAnalysis> {
    const jobAnalysisSchema = z.object({
      summary: z.string().optional(),
      requiredSkills: z.array(z.string()),
      desiredSkills: z.array(z.string()),
      requiredExperience: z.string().optional(),
      requiredEducation: z.string().optional(),
      contractType: z.string().optional(),
      location: z.string().optional(),
      responsibilities: z.array(z.string()).optional(),
      keywords: z.array(z.string()).optional(),
      eliminationCriteria: z.array(z.string()).optional(),
      compatibilityScore: z.number().min(0).max(100).optional(),
      strengths: z.array(z.string()).optional(),
      weaknesses: z.array(z.string()).optional(),
      recommendation: z.string().optional(),
    });

    const prompt = `
      Analyze the following job posting and extract the information in JSON format:

      Title: ${input.title}
      Company: ${input.company}
      Description: ${input.description}
      Location: ${input.location || 'Not specified'}
      Salary: ${input.salary || 'Not specified'}
      URL: ${input.url || 'Not specified'}
      Platform: ${input.platform || 'Not specified'}

      Please provide a structured analysis including:
      - summary: Brief summary of the job
      - requiredSkills: Array of required skills
      - desiredSkills: Array of desired/nice-to-have skills
      - requiredExperience: Experience requirements
      - requiredEducation: Education requirements
      - contractType: Type of contract (full-time, part-time, contract, etc.)
      - location: Job location
      - responsibilities: Array of job responsibilities
      - keywords: Important keywords from the job description
      - eliminationCriteria: Criteria that would disqualify a candidate
      - compatibilityScore: Score from 0-100 (this will be calculated later based on user profile)
      - strengths: Candidate strengths that match this job (to be filled later)
      - weaknesses: Candidate weaknesses for this job (to be filled later)
      - recommendation: Recommendation for applying

      Return ONLY valid JSON.
    `;

    return this.parseStructuredOutput(prompt, jobAnalysisSchema);
  }

  async calculateMatch(input: MatchInput): Promise<MatchResult> {
    const matchResultSchema = z.object({
      score: z.number().min(0).max(100),
      details: z.array(z.string()),
    });

    const prompt = `
      Calculate the compatibility score between the candidate and the job.

      Candidate Profile:
      ${JSON.stringify(input.userProfile)}

      Candidate Resume:
      ${JSON.stringify(input.resume)}

      Job Analysis:
      ${JSON.stringify(input.jobAnalysis)}

      Consider:
      1. Skills match (required and desired skills)
      2. Experience match
      3. Education match
      4. Location preferences
      5. Salary expectations
      6. Contract type preferences

      Provide a score from 0-100 where 100 is a perfect match.
      Also provide details explaining the score.

      Return ONLY valid JSON.
    `;

    return this.parseStructuredOutput(prompt, matchResultSchema);
  }

  async generateCoverLetter(input: CoverLetterInput): Promise<string> {
    // For cover letter generation, we'll use a simpler approach since we expect free text
    const prompt = `
      Generate a professional cover letter for the following job application:

      Candidate Profile:
      ${JSON.stringify(input.userProfile)}

      Candidate Resume:
      ${JSON.stringify(input.resume)}

      Job Analysis:
      ${JSON.stringify(input.jobAnalysis)}

      Company Name: ${input.companyName || 'Hiring Manager'}
      Position Title: ${input.positionTitle || input.jobAnalysis?.summary || 'the position'}

      The cover letter should:
      1. Be addressed to the hiring manager or company
      2. Highlight relevant skills and experiences from the candidate's background
      3. Explain why the candidate is interested in this specific position and company
      4. Show how the candidate's background aligns with the job requirements
      5. Be professional, concise, and compelling
      6. Be approximately 3-4 paragraphs long

      Return ONLY the cover letter text, no additional commentary.
    `;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Error generating cover letter:', error);
      // Fallback cover letter
      return `Dear Hiring Manager,

I am writing to express my interest in the position at ${input.companyName}. With my background in ${input.userProfile?.title || 'my field'}, I believe I would be a valuable addition to your team.

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experience align with your needs.

Sincerely,
[Your Name]`;
    }
  }

  async answerApplicationQuestion(
    input: ApplicationQuestionInput
  ): Promise<string> {
    const prompt = `
      Provide a concise and professional answer to the following job application question based on the candidate's profile.

      Question: ${input.question}

      Candidate Profile:
      ${JSON.stringify(input.userProfile)}

      Candidate Resume:
      ${JSON.stringify(input.resume)}

      ${input.coverLetter ? `Cover Letter: ${input.coverLetter}` : ''}

      ${input.jobAnalysis ? `Job Analysis: ${JSON.stringify(input.jobAnalysis)}` : ''}

      The answer should:
      1. Directly address the question
      2. Highlight relevant experiences, skills, or achievements from the candidate's background
      3. Be honest and authentic
      4. Be professional in tone
      5. Be concise but comprehensive

      Return ONLY the answer text, no additional commentary.
    `;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error('Error answering application question:', error);
      // Fallback answer
      return `Based on my background and experience, I am well-suited to address this question. My professional history has equipped me with the relevant skills and knowledge to excel in this area.`;
    }
  }
}