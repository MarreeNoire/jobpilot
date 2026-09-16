import { Request, Response } from 'express';
import { Resend } from 'resend';
import { prisma } from '../../../../packages/database/src/index';
import { otpRequestSchema, otpVerifySchema } from '../../../../packages/validation/src/userValidation';
import type { z } from 'zod';
import { signAuthToken } from '../utils/jwt';
import { AUTH_COOKIE_NAME } from '../middleware/auth';
import { generateOtpCode, hashOtpCode, verifyOtpCode, OTP_TTL_MS } from '../utils/otp';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

function toPublicUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
}) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

async function sendOtpEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // En dev sans cle Resend, on affiche le code dans les logs pour pouvoir tester.
    console.warn(`[otp] RESEND_API_KEY absent — code pour ${email} : ${code}`);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'JobPilot <onboarding@resend.dev>';

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: email,
      subject: `Votre code de connexion JobPilot : ${code}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#0f172a">Votre code de connexion</h2>
          <p style="color:#334155;font-size:15px">Utilisez ce code pour vous connecter a JobPilot. Il expire dans 10 minutes.</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#2563eb;margin:24px 0">${code}</p>
          <p style="color:#94a3b8;font-size:12px">Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[otp] Erreur envoi email :', err);
  }
}

/**
 * Etape 1 : l'utilisateur saisit son email (+ role s'il s'inscrit pour la
 * premiere fois). On genere un code, on l'enregistre hashe, et on l'envoie
 * par email. On ne revele jamais si l'email existe deja ou non.
 */
export async function requestOtp(req: Request, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof otpRequestSchema>;

  const code = generateOtpCode();
  const hashedCode = await hashOtpCode(code);

  // Invalide les codes precedents non utilises pour cet email.
  await prisma.otpCode.updateMany({
    where: { email: data.email, consumed: false },
    data: { consumed: true },
  });

  await prisma.otpCode.create({
    data: {
      email: data.email,
      code: hashedCode,
      role: data.role ?? 'CANDIDATE',
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendOtpEmail(data.email, code);

  res.status(200).json({ message: 'Code envoye si l\'adresse est valide.' });
}

/**
 * Etape 2 : verification du code. Cree le compte s'il n'existe pas encore
 * (role choisi lors de la demande de code), sinon connecte le compte existant.
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof otpVerifySchema>;

  const otpRecord = await prisma.otpCode.findFirst({
    where: { email: data.email, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    res.status(401).json({ error: 'Code invalide ou expire' });
    return;
  }

  const isValid = await verifyOtpCode(data.code, otpRecord.code);
  if (!isValid) {
    res.status(401).json({ error: 'Code invalide ou expire' });
    return;
  }

  await prisma.otpCode.update({ where: { id: otpRecord.id }, data: { consumed: true } });

  let user = await prisma.user.findUnique({ where: { email: data.email } });

  if (!user) {
    const emailLocalPart = data.email.split('@')[0] ?? 'Utilisateur';
    user = await prisma.user.create({
      data: {
        email: data.email,
        password: null,
        firstName: emailLocalPart,
        lastName: '',
        role: otpRecord.role,
      },
    });
  }

  const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);

  res.status(200).json({ user: toPublicUser(user) });
}
