'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { API_BASE_URL, parseApiError } from '@/lib/api';

export interface Resume {
  id: string;
  userId: string;
  title: string;
  fileUrl: string | null;
  fileName?: string | null;
  fileMimeType?: string | null;
  fileContent?: string | null;
  hasUploadedFile?: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeFormState {
  error?: string;
  success?: string;
}

function getTokenFromCookies() {
  return cookies().then((cookieStore) => cookieStore.get('jobpilot_token')?.value);
}

export async function createResumeAction(
  _previousState: ResumeFormState,
  formData: FormData
): Promise<ResumeFormState> {
  const token = await getTokenFromCookies();

  if (!token) {
    return { error: 'Authentication required' };
  }

  let fileUrl = String(formData.get('fileUrl') ?? '').trim();
  const uploadedFile = formData.get('file');

  if (uploadedFile instanceof File && uploadedFile.size > 0) {
    const bytes = await uploadedFile.arrayBuffer();
    const uploadPayload = {
      fileContent: Buffer.from(bytes).toString('base64'),
      fileName: uploadedFile.name,
      fileMimeType: uploadedFile.type || 'application/octet-stream',
    };

    const uploadResponse = await fetch(`${API_BASE_URL}/api/resume-uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `jobpilot_token=${token}`,
      },
      body: JSON.stringify(uploadPayload),
      cache: 'no-store',
    });

    if (!uploadResponse.ok) {
      return { error: await parseApiError(uploadResponse) };
    }

    const uploaded = (await uploadResponse.json()) as {
      fileUrl: string;
      fileName: string;
      fileMimeType: string;
    };

    fileUrl = `${API_BASE_URL}${uploaded.fileUrl}`;
  }

  const payload = {
    title: String(formData.get('title') ?? '').trim(),
    fileUrl: fileUrl || undefined,
    isPrimary: formData.get('isPrimary') === 'on',
  };

  const response = await fetch(`${API_BASE_URL}/api/resumes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jobpilot_token=${token}`,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseApiError(response) };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/resumes');

  return { success: 'Resume added successfully.' };
}

export async function deleteResumeAction(id: string): Promise<void> {
  const token = await getTokenFromCookies();

  if (!token) {
    return;
  }

  await fetch(`${API_BASE_URL}/api/resumes/${id}`, {
    method: 'DELETE',
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/resumes');
}

export async function setPrimaryResumeAction(id: string): Promise<void> {
  const token = await getTokenFromCookies();

  if (!token) {
    return;
  }

  await fetch(`${API_BASE_URL}/api/resumes/${id}/primary`, {
    method: 'PATCH',
    headers: {
      Cookie: `jobpilot_token=${token}`,
    },
    cache: 'no-store',
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/resumes');
}
