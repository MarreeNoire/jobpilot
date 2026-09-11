import 'dotenv/config';
import { Resend } from 'resend';

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY manquant dans .env');
    process.exit(1);
  }

  console.log('📧 Envoi du mail de test...');
  console.log(`   De      : ${from}`);
  console.log(`   À       : sesluc050@gmail.com`);

  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send({
    from,
    to: 'sesluc050@gmail.com',
    subject: 'JobPilot — Test de notification Resend ✅',
    html: `
      <!DOCTYPE html>
      <html lang="fr">
      <body style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:0 20px">
        <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:12px 12px 0 0;padding:24px 28px">
          <h1 style="margin:0;color:#fff;font-size:20px">JobPilot</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:12px">Système de notification</p>
        </div>
        <div style="background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:28px">
          <h2 style="margin:0 0 16px;color:#0f172a;font-size:18px">✅ Configuration Resend réussie !</h2>
          <p style="color:#475569;line-height:1.7;margin:0">
            Bonjour,<br><br>
            Ce mail confirme que l'intégration <strong>Resend</strong> est correctement configurée
            dans votre application <strong>JobPilot</strong>.<br><br>
            À partir de maintenant, les candidats recevront automatiquement un email
            à chaque changement de statut de leur candidature.
          </p>
          <div style="margin-top:24px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
            <p style="margin:0;color:#166534;font-size:14px;font-weight:600">
              🎉 Pipeline de recrutement opérationnel
            </p>
          </div>
        </div>
        <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:20px">
          JobPilot — Votre copilote vers le poste idéal.
        </p>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error('❌ Erreur Resend :', error);
    process.exit(1);
  }

  console.log('✅ Email envoyé avec succès !');
  console.log('   ID Resend :', data?.id);
  console.log('   Vérifie ta boîte mail : sesluc050@gmail.com');
}

main().catch((err) => {
  console.error('Erreur inattendue :', err);
  process.exit(1);
});
