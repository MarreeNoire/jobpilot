import { Resend } from 'resend';
import { prisma } from '../../../../packages/database/src/index';

export interface NotifyApplicationStatusChangeParams {
  userId: string;
  jobTitle: string;
  company: string;
  status: string;
  /** Message optionnel fourni par le recruteur (personnalise la notification). */
  message?: string;
}

const CANDIDATE_APPLICATIONS_LINK = '/dashboard/applications';

const STATUS_LABELS: Partial<Record<string, string>> = {
  PENDING: 'En attente',
  REVIEWING: 'En cours d\'examen',
  SHORTLISTED: 'Présélectionné(e)',
  INTERVIEW_SCHEDULED: 'Entretien planifié',
  ACCEPTED: 'Candidature acceptée 🎉',
  REJECTED: 'Candidature non retenue',
};

const STATUS_MESSAGE_BUILDERS: Partial<Record<string, (jobTitle: string, company: string) => string>> = {
  PENDING: (jobTitle, company) =>
    `Votre candidature pour le poste "${jobTitle}" chez ${company} a bien été reçue.`,
  REVIEWING: (jobTitle, company) =>
    `Votre candidature pour le poste "${jobTitle}" chez ${company} est en cours d'examen par l'équipe de recrutement.`,
  SHORTLISTED: (jobTitle, company) =>
    `Bonne nouvelle ! Votre candidature pour le poste "${jobTitle}" chez ${company} a été présélectionnée.`,
  INTERVIEW_SCHEDULED: (jobTitle, company) =>
    `Vous êtes convoqué(e) à un entretien pour le poste "${jobTitle}" chez ${company}. Le recruteur vous contactera pour confirmer les détails.`,
  ACCEPTED: (jobTitle, company) =>
    `Félicitations ! Votre candidature pour le poste "${jobTitle}" chez ${company} a été retenue.`,
  REJECTED: (jobTitle, company) =>
    `Votre candidature pour le poste "${jobTitle}" chez ${company} n'a malheureusement pas été retenue à ce stade.`,
};

function buildNotificationBody(params: NotifyApplicationStatusChangeParams): string {
  const trimmedMessage = params.message?.trim();
  if (trimmedMessage) {
    return trimmedMessage;
  }
  const builder = STATUS_MESSAGE_BUILDERS[params.status];
  if (builder) {
    return builder(params.jobTitle, params.company);
  }
  return `Le statut de votre candidature pour le poste "${params.jobTitle}" chez ${params.company} a été mis à jour : ${params.status}.`;
}

function buildEmailHtml(
  firstName: string,
  subject: string,
  body: string,
  appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ctaPath = '/dashboard/applications',
  ctaLabel = 'Voir mes candidatures →'
): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px 12px 0 0;padding:28px 32px">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">JobPilot</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px">Votre espace emploi intelligent</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px">Bonjour ${firstName},</p>
          <h2 style="margin:0 0 20px;color:#0f172a;font-size:20px;font-weight:700">${subject}</h2>
          <div style="background:#f1f5f9;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px">
            <p style="margin:0;color:#334155;font-size:15px;line-height:1.7">${body}</p>
          </div>
          <a href="${appUrl}${ctaPath}"
             style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
            ${ctaLabel}
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 32px;text-align:center">
          <p style="margin:0;color:#94a3b8;font-size:12px">
            JobPilot — Votre copilote vers le poste idéal.<br>
            Cet email a été envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Helper to send an email to a recruiter (either from User relation or contactEmail)
 */
async function sendRecruiterEmail(
  recruiter: { email: string; firstName: string },
  params: { jobTitle: string; company: string; candidateName: string; jobId: string }
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: recruiter.email,
      subject: `JobPilot — Nouvelle candidature pour "${params.jobTitle}"`,
      html: buildEmailHtml(
        recruiter.firstName,
        `Nouvelle candidature reçue`,
        `${params.candidateName} vient de postuler à votre offre <strong>${params.jobTitle}</strong> chez ${params.company}.<br><br>Consultez le profil du candidat et gérez le pipeline de recrutement depuis votre espace JobPilot.`,
        appUrl,
        `/dashboard/jobs/${params.jobId}/applications`,
        'Voir les candidatures →'
      ),
    });
    console.log(`[email] Recruteur notifié (${recruiter.email}) — nouvelle candidature pour "${params.jobTitle}"`);
  } catch (err) {
    console.error('[email] Erreur notification recruteur :', err);
  }
}

/**
 * Notifie le recruteur qu'une nouvelle candidature vient d'être soumise
 * sur l'une de ses offres. Crée aussi une notification interne pour le candidat.
 */
export async function notifyNewApplication(params: {
  candidateUserId: string;
  candidateName: string;
  jobTitle: string;
  company: string;
  jobId: string;
  recruiterUserId: string | null;
}): Promise<void> {
  // Notification interne + email de confirmation pour le candidat
  const candidateBody = `Votre candidature pour le poste "${params.jobTitle}" chez ${params.company} a bien été envoyée. Le recruteur prendra contact avec vous prochainement.`;

  await prisma.notification.create({
    data: {
      userId: params.candidateUserId,
      title: 'Candidature envoyée ✅',
      body: candidateBody,
      link: CANDIDATE_APPLICATIONS_LINK,
    },
  });

  await dispatchEmail({
    userId: params.candidateUserId,
    subject: 'Candidature envoyée ✅',
    body: candidateBody,
  });

  // 1️⃣ Email au recruteur via la relation platform (si existant)
  if (params.recruiterUserId) {
    const recruiter = await prisma.user.findUnique({
      where: { id: params.recruiterUserId },
      select: { email: true, firstName: true },
    });
    if (recruiter) {
      await sendRecruiterEmail(recruiter, params);
    }
  }

  // 2️⃣ Email au recruteur via contactEmail (scraped/imported jobs)
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: { contactEmail: true, title: true, company: true },
  });
  if (job?.contactEmail) {
    await sendRecruiterEmail(
      { email: job.contactEmail, firstName: '' }, // firstName may be unknown
      params
    );
  }
}

/**
 * Email récapitulatif envoyé au candidat après des candidatures automatiques.
 * Un seul email pour N offres — évite le spam.
 */
export async function notifyAutoApplicationBatch(
  userId: string,
  jobs: { jobTitle: string; company: string; jobId: string }[]
): Promise<void> {
  if (jobs.length === 0) return;

  const count = jobs.length;
  const jobListHtml = jobs
    .map((j) => `&bull; <strong>${j.jobTitle}</strong> chez ${j.company}`)
    .join('<br>');

  const body = `JobPilot a postulé automatiquement pour vous à <strong>${count} offre${count > 1 ? 's' : ''}</strong> correspondant à vos règles d'automatisation :<br><br>${jobListHtml}<br><br>Vous pouvez suivre l'état de ces candidatures depuis votre espace.`;

  // Une notification interne par offre
  await Promise.all(
    jobs.map((j) =>
      prisma.notification.create({
        data: {
          userId,
          title: `Candidature auto — ${j.jobTitle}`,
          body: `Candidature envoyée automatiquement à ${j.company}.`,
          link: CANDIDATE_APPLICATIONS_LINK,
        },
      })
    )
  );

  // Un seul email récapitulatif
  await dispatchEmail({
    userId,
    subject: `${count} candidature${count > 1 ? 's' : ''} envoyée${count > 1 ? 's' : ''} automatiquement`,
    body,
  });
}

/**
 * Notifie le recruteur qu'une action du candidat (soumission ou retrait)
 * vient de se produire sur l'une de ses offres.
 */
export async function notifyRecruiterApplicationEvent(params: {
  recruiterUserId: string | null | undefined;
  candidateName: string;
  jobTitle: string;
  company: string;
  jobId: string;
  event: 'SUBMITTED' | 'WITHDRAWN';
}): Promise<void> {
  if (!params.recruiterUserId) return;

  const title = params.event === 'SUBMITTED' ? 'Nouvelle candidature reçue' : 'Candidature retirée';
  const body =
    params.event === 'SUBMITTED'
      ? `${params.candidateName} vient de soumettre sa candidature pour "${params.jobTitle}" chez ${params.company}.`
      : `${params.candidateName} a retiré sa candidature pour "${params.jobTitle}" chez ${params.company}.`;

  await prisma.notification.create({
    data: {
      userId: params.recruiterUserId,
      title,
      body,
      link: `/dashboard/jobs/${params.jobId}/applications`,
    },
  });

  await dispatchEmail({ userId: params.recruiterUserId, subject: title, body });
}

export async function notifyApplicationStatusChange(
  params: NotifyApplicationStatusChangeParams
): Promise<void> {
  const body = buildNotificationBody(params);
  const subject = STATUS_LABELS[params.status] ?? 'Mise à jour de votre candidature';

  await prisma.notification.create({
    data: {
      userId: params.userId,
      title: subject,
      body,
      link: CANDIDATE_APPLICATIONS_LINK,
    },
  });

  await dispatchEmail({ userId: params.userId, subject, body });
}

export async function notifyInterviewScheduled(params: {
  userId: string;
  jobTitle: string;
  company: string;
  scheduledAt: Date;
  timezone: string;
  mode: 'VIDEO' | 'PHONE' | 'ONSITE';
  meetingUrl?: string;
  notes?: string;
}): Promise<void> {
  const modeLabels = { VIDEO: 'visioconférence', PHONE: 'téléphone', ONSITE: 'sur site' };
  const date = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: params.timezone,
  }).format(params.scheduledAt);
  const details = [
    `Date : ${date} (${params.timezone})`,
    `Format : ${modeLabels[params.mode]}`,
    params.meetingUrl ? `Lien : ${params.meetingUrl}` : undefined,
    params.notes?.trim() ? `Informations : ${params.notes.trim()}` : undefined,
  ].filter(Boolean).join('\n');
  const body = `Un entretien est planifié pour votre candidature au poste "${params.jobTitle}" chez ${params.company}.\n\n${details}`;
  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] ?? character);
  const emailBody = `Un entretien est planifié pour votre candidature au poste "${escapeHtml(params.jobTitle)}" chez ${escapeHtml(params.company)}.<br><br>${details
    .split('\n')
    .map(escapeHtml)
    .join('<br>')}`;
  const subject = 'Entretien planifié';

  await prisma.notification.create({
    data: { userId: params.userId, title: subject, body, link: CANDIDATE_APPLICATIONS_LINK },
  });
  await dispatchEmail({ userId: params.userId, subject, body: emailBody });
}

async function dispatchEmail(params: {
  userId: string;
  subject: string;
  body: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY non configuré — email non envoyé (notification interne créée).');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { email: true, firstName: true },
  });

  if (!user) {
    console.error(`[email] Utilisateur introuvable (id=${params.userId})`);
    return;
  }

  const from = process.env.RESEND_FROM_EMAIL ?? 'JobPilot <noreply@jobpilot.app>';

  try {
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from,
      to: user.email,
      subject: `JobPilot — ${params.subject}`,
      html: buildEmailHtml(user.firstName, params.subject, params.body),
    });

    if (error) {
      console.error('[email] Erreur Resend :', error);
    } else {
      console.log(`[email] Envoyé à ${user.email} — sujet : ${params.subject}`);
    }
  } catch (err) {
    console.error('[email] Exception lors de l\'envoi :', err);
  }
}