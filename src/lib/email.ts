import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendVerificationCode(
  email: string,
  code: string,
  retryCount = 0
) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@molla.ru',
    to: email,
    subject: 'Код подтверждения - Molla',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Подтверждение email адреса</h2>
        <p>Ваш код подтверждения для входа в Molla:</p>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #6c5ce7; letter-spacing: 8px;">${code}</span>
        </div>
        <p>Код действителен в течение 10 минут.</p>
        <p>Если вы не запрашивали этот код, просто игнорируйте это сообщение.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Это автоматическое сообщение, пожалуйста, не отвечайте на него.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error(
      `❌ Email send failed (attempt ${retryCount + 1}):`,
      error.message
    );

    // Определяем тип ошибки и даем понятное сообщение
    let errorType = 'UNKNOWN_ERROR';
    if (error.code === 'ECONNREFUSED') {
      errorType = 'CONNECTION_REFUSED';
      console.warn('⚠️ SMTP connection refused. Check VPN/firewall settings.');
    } else if (error.code === 'ETIMEDOUT') {
      errorType = 'TIMEOUT';
      console.warn('⚠️ SMTP timeout. Network issues or slow connection.');
    } else if (error.code === 'EAUTH') {
      errorType = 'AUTH_FAILED';
      console.warn('⚠️ SMTP authentication failed. Check credentials.');
    } else if (error.message?.includes('socket close')) {
      errorType = 'SOCKET_CLOSE';
      console.warn(
        '⚠️ Unexpected socket close. VPN or network issue detected.'
      );
    }

    // Повторяем попытку до 2 раз при определенных ошибках
    if (
      retryCount < 2 &&
      ['ECONNREFUSED', 'ETIMEDOUT', 'SOCKET_CLOSE'].includes(error.code)
    ) {
      console.log(
        `🔄 Retrying email send in 2 seconds... (${retryCount + 1}/2)`
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return sendVerificationCode(email, code, retryCount + 1);
    }

    return false;
  }
}
