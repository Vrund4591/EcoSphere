const nodemailer = require('nodemailer');

/* ============================================================================
   EcoSphere email service — themed transactional + alert emails.

   SMTP is optional: if the SMTP_* env vars are missing, every send is a no-op
   (returns false) so nothing ever breaks the triggering action. Templates use
   the editorial brand (dark-forest header, E/S/G/XP colour rule, serif display,
   forest primary) rendered as email-safe, inline-styled HTML.
   ============================================================================ */

const APP_URL = (process.env.APP_URL || process.env.CORS_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

// Web-safe stacks that approximate Newsreader / IBM Plex Sans / IBM Plex Mono.
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace";

let transporter;
let resolved = false;

function getTransporter() {
  if (resolved) return transporter;
  resolved = true;
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    transporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function isEmailConfigured() {
  return !!getTransporter();
}

// ─── helpers ────────────────────────────────────────────────────────────────
function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function absUrl(link) {
  if (!link) return APP_URL;
  if (/^https?:\/\//i.test(link)) return link;
  return `${APP_URL}${link.startsWith('/') ? '' : '/'}${link}`;
}

function button(label, href, accent) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 4px;">
      <tr><td style="border-radius:9px; background:${accent};">
        <a href="${esc(href)}" target="_blank"
           style="display:inline-block; padding:12px 24px; font-family:${SANS}; font-size:14px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:9px;">
          ${esc(label)}
        </a>
      </td></tr>
    </table>`;
}

/**
 * Shared email shell. `bodyHtml` is trusted (built here); dynamic values passed
 * into it must already be escaped by the caller.
 */
function layout({ preheader = '', eyebrow = '', accent = '#2C5E43', heading = '', bodyHtml = '', cta }) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(heading)}</title></head>
<body style="margin:0; padding:0; background:#EAE8E0; -webkit-font-smoothing:antialiased;">
  <span style="display:none!important; visibility:hidden; opacity:0; height:0; width:0; overflow:hidden; mso-hide:all;">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EAE8E0;">
    <tr><td align="center" style="padding:34px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px; max-width:560px;">

        <!-- brand header -->
        <tr><td style="background:#14231B; padding:26px 34px 0; border-radius:16px 16px 0 0;">
          <div style="font-family:${SERIF}; font-size:21px; font-weight:500; color:#F3F1E9; letter-spacing:.2px;">EcoSphere</div>
          <div style="font-family:${MONO}; font-size:11px; color:#9FAF9F; margin-top:3px; letter-spacing:.03em;">ESG MANAGEMENT PLATFORM</div>
        </td></tr>
        <tr><td style="background:#14231B; padding:16px 34px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td height="4" style="background:#5EA97E; border-radius:2px 0 0 2px; font-size:0; line-height:0;">&nbsp;</td>
            <td height="4" style="background:#7C93C4; font-size:0; line-height:0;">&nbsp;</td>
            <td height="4" style="background:#9D8AC9; font-size:0; line-height:0;">&nbsp;</td>
            <td height="4" style="background:#C99A45; border-radius:0 2px 2px 0; font-size:0; line-height:0;">&nbsp;</td>
          </tr></table>
        </td></tr>

        <!-- body card -->
        <tr><td style="background:#FFFFFF; padding:32px 34px 34px; border-left:1px solid #E4E2D8; border-right:1px solid #E4E2D8;">
          ${eyebrow ? `<div style="font-family:${MONO}; font-size:11px; font-weight:600; letter-spacing:.09em; text-transform:uppercase; color:${accent};">${esc(eyebrow)}</div>` : ''}
          <h1 style="margin:8px 0 0; font-family:${SERIF}; font-size:26px; font-weight:500; line-height:1.25; color:#182420;">${esc(heading)}</h1>
          <div style="margin-top:16px; font-family:${SANS}; font-size:14.5px; line-height:1.65; color:#5E6A62;">${bodyHtml}</div>
          ${cta ? button(cta.label, cta.href, accent) : ''}
        </td></tr>

        <!-- footer -->
        <tr><td style="background:#F6F5F1; padding:22px 34px; border:1px solid #E4E2D8; border-top:none; border-radius:0 0 16px 16px;">
          <div style="font-family:${SANS}; font-size:12.5px; line-height:1.6; color:#8C968E;">
            You're receiving this because you have an EcoSphere account. Manage what reaches your
            inbox under <span style="color:#5E6A62;">Settings → Notifications</span>.
          </div>
          <div style="font-family:${MONO}; font-size:10.5px; color:#A9B0A8; margin-top:12px;">
            © ${year} EcoSphere · ESG Management Platform
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Strip tags for the plaintext part.
function toText(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t || !to) return false;
  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: toText(html),
    });
    return true;
  } catch (err) {
    console.error('email send failed:', err.message);
    return false;
  }
}

// ─── templates ────────────────────────────────────────────────────────────────
const TYPE_META = {
  COMPLIANCE_ISSUE:   { eyebrow: 'Compliance alert',       accent: '#96422D' },
  CSR_APPROVAL:       { eyebrow: 'Participation approved',  accent: '#2C5E43' },
  CSR_REJECTION:      { eyebrow: 'Participation update',    accent: '#96422D' },
  CHALLENGE_APPROVED: { eyebrow: 'Challenge approved',      accent: '#2C5E43' },
  CHALLENGE_REJECTED: { eyebrow: 'Challenge update',        accent: '#96422D' },
  BADGE_UNLOCK:       { eyebrow: 'Badge unlocked',          accent: '#B58734' },
  POLICY_REMINDER:    { eyebrow: 'Policy reminder',         accent: '#4E71A8' },
  REWARD_REDEEMED:    { eyebrow: 'Reward redeemed',         accent: '#7A64AE' },
};

/** Welcome email — sent on signup (transactional). */
async function sendWelcomeEmail(user) {
  if (!user?.email) return false;
  const first = esc((user.name || '').split(' ')[0] || 'there');
  const dept = user.department?.name ? ` on the <strong style="color:#5E6A62;">${esc(user.department.name)}</strong> team` : '';
  const bodyHtml = `
    <p style="margin:0 0 14px;">Welcome aboard${dept ? '' : ''}, ${first} — your EcoSphere account is ready${dept}.</p>
    <p style="margin:0 0 14px;">EcoSphere is where your organisation measures and improves its
      <strong style="color:#3E7C57;">Environmental</strong>,
      <strong style="color:#4E71A8;">Social</strong> and
      <strong style="color:#7A64AE;">Governance</strong> performance — with challenges and XP built into every module.</p>
    <p style="margin:0 0 6px;">Here's how to start earning:</p>
    <ul style="margin:0; padding-left:18px; color:#5E6A62;">
      <li style="margin-bottom:6px;">Join a <strong>CSR activity</strong> or <strong>challenge</strong> and submit your proof.</li>
      <li style="margin-bottom:6px;">Collect <strong style="color:#B58734;">XP &amp; points</strong>, auto-unlock badges, and climb the leaderboard.</li>
      <li>Acknowledge policies and complete trainings to keep your department compliant.</li>
    </ul>`;
  const html = layout({
    preheader: 'Your EcoSphere account is ready — start earning XP across E, S and G.',
    eyebrow: 'Welcome aboard',
    accent: '#2C5E43',
    heading: `Welcome to EcoSphere, ${first}.`,
    bodyHtml,
    cta: { label: 'Open EcoSphere', href: APP_URL },
  });
  return sendMail({ to: user.email, subject: 'Welcome to EcoSphere', html });
}

/** Alert email — mirrors an in-app notification. Accent + eyebrow vary by type. */
async function sendAlertEmail({ user, type, title, message, link }) {
  if (!user?.email) return false;
  const meta = TYPE_META[type] || { eyebrow: 'Notification', accent: '#2C5E43' };
  const bodyHtml = message
    ? `<p style="margin:0;">${esc(message)}</p>`
    : `<p style="margin:0;">Open EcoSphere to see the details.</p>`;
  const html = layout({
    preheader: message || title || 'You have a new EcoSphere notification.',
    eyebrow: meta.eyebrow,
    accent: meta.accent,
    heading: title || 'Notification',
    bodyHtml,
    cta: { label: 'View in EcoSphere', href: absUrl(link) },
  });
  return sendMail({ to: user.email, subject: title || 'EcoSphere notification', html });
}

module.exports = { isEmailConfigured, sendWelcomeEmail, sendAlertEmail };
