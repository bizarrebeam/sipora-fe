import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { secret, to, subject, html } = req.body;

  const serverSecret = process.env.VERCEL_EMAIL_SECRET || 'supersekret';
  
  if (secret !== serverSecret) {
    return res.status(401).json({ message: 'Unauthorized proxy request' });
  }

  if (!to || !subject || !html) {
      return res.status(400).json({ message: 'Missing required email fields' });
  }

  try {
      const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"SIPORA SMP" <${process.env.EMAIL_HOST_USER}>`,
      to,
      subject,
      html,
    });

    return res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return res.status(500).json({ error: error.message });
  }
}
