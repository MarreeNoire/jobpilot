import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const uploadsRoot = path.resolve(process.cwd(), 'uploads', 'resumes');

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export interface StoredResumeFile {
  fileUrl: string;
  fileName: string;
  fileMimeType: string;
}

export async function storeResumeFile(params: {
  originalFileName: string;
  mimeType: string;
  contentBase64: string;
}): Promise<StoredResumeFile> {
  const extension = path.extname(params.originalFileName) || '.bin';
  const safeBaseName = sanitizeFilename(path.basename(params.originalFileName, extension));
  const generatedName = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName}${extension}`;
  const absolutePath = path.join(uploadsRoot, generatedName);

  await fs.mkdir(uploadsRoot, { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(params.contentBase64, 'base64'));

  return {
    fileUrl: `/uploads/resumes/${generatedName}`,
    fileName: params.originalFileName,
    fileMimeType: params.mimeType || 'application/octet-stream',
  };
}

export async function deleteStoredResumeFile(fileUrl: string | null | undefined): Promise<void> {
  if (!fileUrl) {
    return;
  }

  let pathname = fileUrl;

  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    try {
      pathname = new URL(fileUrl).pathname;
    } catch {
      return;
    }
  }

  const expectedPrefix = '/uploads/resumes/';
  if (!pathname.startsWith(expectedPrefix)) {
    return;
  }

  const fileName = pathname.slice(expectedPrefix.length);
  if (!fileName || fileName.includes('..') || path.isAbsolute(fileName)) {
    return;
  }

  const absolutePath = path.join(uploadsRoot, fileName);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== 'ENOENT') {
      throw error;
    }
  }
}
