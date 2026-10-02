// Sends an email through SMTP (nodemailer).
// In development, if SMTP isn't configured, the email is printed in the terminal instead,
// so you can test "Forgot password" without setting up email.
async function sendEmail({ to, subject, text, html }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)");
    }
    console.log(`\n📧 [DEV - SMTP not configured, email not sent]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`);
    return { sent: false };
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch {
    throw new Error("nodemailer is not installed. Run: npm install nodemailer");
  }

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({ from: EMAIL_FROM || `HealthSense AI <${SMTP_USER}>`, to, subject, text, html });
  return { sent: true };
}

module.exports = sendEmail;
