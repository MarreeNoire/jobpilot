import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { storeResumeFile } from '../services/resumeStorage';

export async function uploadResumeFile(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const body = req.body as {
    fileName?: string;
    fileMimeType?: string;
    fileContent?: string;
  };

  if (!body.fileName || !body.fileContent) {
    res.status(400).json({ error: 'fileName and fileContent are required' });
    return;
  }

  const stored = await storeResumeFile({
    originalFileName: body.fileName,
    mimeType: body.fileMimeType || 'application/octet-stream',
    contentBase64: body.fileContent,
  });

  res.status(201).json(stored);
}
