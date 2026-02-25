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
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f4f5fb; padding: 32px 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); padding: 32px 24px 28px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img
              src="https://molla.s3.cloud.ru/icons/molla-logo-png.png"
              alt="Molla"
              style="height: 40px; margin-bottom: 8px;"
            />
          </div>
          <div style="text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; line-height: 1.3; color: #111827;">
              Подтверждение&nbsp;email
            </h2>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
              Для входа в аккаунт Molla введите код, указанный ниже.
            </p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; margin: 24px 0 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
            <span style="font-size: 32px; font-weight: bold; color: #6c5ce7; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="margin: 0 0 4px; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">
            Код действует в течение <strong>10 минут</strong>.
          </p>
          <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: #9ca3af; text-align: center;">
            Если вы не запрашивали вход в Molla, просто проигнорируйте это письмо.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0 12px;">
          <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; text-align: center; margin: 0;">
            Это автоматическое письмо, не отвечайте на него.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return sendVerificationCode(email, code, retryCount + 1);
    }

    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  retryCount = 0
) {
  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@molla.ru',
    to: email,
    subject: 'Сброс пароля - Molla',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f4f5fb; padding: 32px 16px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); padding: 32px 24px 28px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img
              src="https://molla.s3.cloud.ru/icons/molla-logo-png.png"
              alt="Molla"
              style="height: 40px; margin-bottom: 8px;"
            />
          </div>
          <div style="text-align: center; margin-bottom: 16px;">
            <h2 style="margin: 0 0 8px; font-size: 22px; line-height: 1.3; color: #111827;">
              Сброс пароля
            </h2>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4b5563;">
              Вы запросили сброс пароля для своего аккаунта Molla.
            </p>
          </div>
          <p style="margin: 20px 0 8px; font-size: 14px; line-height: 1.6; color: #4b5563; text-align: center;">
            Чтобы задать новый пароль, нажмите на кнопку ниже:
          </p>
          <div style="text-align: center; margin: 16px 0 22px;">
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #6c5ce7; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Сбросить пароль
            </a>
          </div>
          <p style="margin: 0 0 6px; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">
            Если кнопка не нажимается, скопируйте и вставьте ссылку в адресную строку браузера:
          </p>
          <p style="word-break: break-all; color: #4b5563; font-size: 12px; line-height: 1.6; text-align: center; margin: 0 0 8px;">
            ${resetLink}
          </p>
          <p style="margin: 0 0 4px; font-size: 13px; line-height: 1.6; color: #6b7280; text-align: center;">
            Ссылка действительна в течение <strong>15 минут</strong>.
          </p>
          <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.6; color: #9ca3af; text-align: center;">
            Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0 12px;">
          <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; text-align: center; margin: 0;">
            Это автоматическое письмо, не отвечайте на него.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error: any) {
    console.error(
      `❌ Password reset email send failed (attempt ${retryCount + 1}):`,
      error.message
    );

    if (
      retryCount < 2 &&
      ['ECONNREFUSED', 'ETIMEDOUT', 'SOCKET_CLOSE'].includes(error.code)
    ) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return sendPasswordResetEmail(email, resetLink, retryCount + 1);
    }

    return false;
  }
}
