const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

async function sendOTPEmail(moodleId, otp) {
  const email = `${moodleId}@apsit.edu.in`

  await transporter.sendMail({
    from: `"NEXUS-ARU" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your NEXUS-ARU verification code',
    html: `
      <div style="font-family: monospace; padding: 32px; max-width: 400px;">
        <h2 style="letter-spacing: 4px; text-transform: uppercase; margin-bottom: 24px;">NEXUS-ARU</h2>
        <p style="color: #444;">Your email verification code is:</p>
        <h1 style="font-size: 48px; letter-spacing: 8px; margin: 16px 0;">${otp}</h1>
        <p style="color: #666;">This code expires in <strong>10 minutes</strong>.</p>
        <p style="color: #666; font-size: 12px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

module.exports = { sendOTPEmail }