import { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../../../../packages/config/src/config';
import { prisma } from '../../../../packages/database/src/index';
import { signAuthToken } from '../utils/jwt';
import { AUTH_COOKIE_NAME } from '../middleware/auth';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const VALID_ROLES = new Set(['CANDIDATE', 'RECRUITER']);

function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  });
}

/**
 * Redirige le navigateur vers la page d'autorisation GitHub. Le role choisi
 * par le candidat/recruteur avant inscription est transmis via `state` afin
 * de pouvoir creer le compte avec le bon role au retour.
 */
export function githubLogin(req: Request, res: Response): void {
  if (!config.GITHUB_CLIENT_ID) {
    res.status(503).send("Connexion GitHub non configuree (GITHUB_CLIENT_ID manquant).");
    return;
  }

  const roleParam = String(req.query.role ?? 'CANDIDATE').toUpperCase();
  const role = VALID_ROLES.has(roleParam) ? roleParam : 'CANDIDATE';

  const params = new URLSearchParams({
    client_id: config.GITHUB_CLIENT_ID,
    redirect_uri: config.GITHUB_CALLBACK_URL,
    scope: 'read:user user:email',
    state: role,
    allow_signup: 'true',
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}

interface GithubTokenResponse {
  access_token?: string;
  error?: string;
}

interface GithubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
}

interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

/**
 * Callback appele par GitHub apres autorisation. Echange le code contre un
 * token, recupere le profil + l'email principal verifie, puis cree ou
 * connecte le compte correspondant.
 */
export async function githubCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code as string | undefined;
  const roleParam = String(req.query.state ?? 'CANDIDATE').toUpperCase();
  const role = (VALID_ROLES.has(roleParam) ? roleParam : 'CANDIDATE') as 'CANDIDATE' | 'RECRUITER';

  if (!code) {
    res.redirect(`${config.FRONTEND_URL}/login?error=github_denied`);
    return;
  }

  try {
    const tokenResponse = await axios.post<GithubTokenResponse>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.GITHUB_CLIENT_ID,
        client_secret: config.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: config.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      res.redirect(`${config.FRONTEND_URL}/login?error=github_token`);
      return;
    }

    const authHeaders = { Authorization: `Bearer ${accessToken}`, Accept: 'application/vnd.github+json' };

    const [{ data: githubUser }, { data: emails }] = await Promise.all([
      axios.get<GithubUser>('https://api.github.com/user', { headers: authHeaders }),
      axios.get<GithubEmail[]>('https://api.github.com/user/emails', { headers: authHeaders }),
    ]);

    const primaryEmail =
      emails.find((e) => e.primary && e.verified)?.email ??
      emails.find((e) => e.verified)?.email ??
      githubUser.email;

    if (!primaryEmail) {
      res.redirect(`${config.FRONTEND_URL}/login?error=github_no_email`);
      return;
    }

    const githubId = String(githubUser.id);

    let user = await prisma.user.findFirst({
      where: { OR: [{ githubId }, { email: primaryEmail }] },
    });

    if (!user) {
      const [firstName, ...rest] = (githubUser.name ?? githubUser.login).split(' ');
      user = await prisma.user.create({
        data: {
          email: primaryEmail,
          password: null,
          githubId,
          firstName: firstName || githubUser.login,
          lastName: rest.join(' ') || '',
          role,
        },
      });
    } else if (!user.githubId) {
      // Compte existant (email/mdp ou OTP) : on lie GitHub pour la prochaine fois.
      user = await prisma.user.update({ where: { id: user.id }, data: { githubId } });
    }

    const token = signAuthToken({ userId: user.id, email: user.email, role: user.role });
    setAuthCookie(res, token);

    res.redirect(`${config.FRONTEND_URL}/${user.role === 'RECRUITER' ? 'dashboard/recruiter' : 'dashboard'}`);
  } catch (err) {
    console.error('[github-auth] Echec de la connexion GitHub :', err);
    res.redirect(`${config.FRONTEND_URL}/login?error=github_failed`);
  }
}
