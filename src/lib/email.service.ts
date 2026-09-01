import nodemailer from 'nodemailer';

import type { AdminConfig } from './admin.types';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  /**
   * 通过SMTP发送邮件
   */
  static async sendViaSMTP(
    config: NonNullable<AdminConfig['EmailConfig']>['smtp'],
    options: EmailOptions
  ): Promise<void> {
    if (!config) {
      throw new Error('SMTP配置不存在');
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    await transporter.sendMail({
      from: config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }

  /**
   * 通过Resend API发送邮件
   */
  static async sendViaResend(
    config: NonNullable<AdminConfig['EmailConfig']>['resend'],
    options: EmailOptions
  ): Promise<void> {
    if (!config) {
      throw new Error('Resend配置不存在');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API错误: ${response.statusText} - ${errorText}`);
    }
  }

  /**
   * 统一发送接口
   */
  static async send(
    emailConfig: AdminConfig['EmailConfig'],
    options: EmailOptions
  ): Promise<void> {
    if (!emailConfig || !emailConfig.enabled) {
      console.log('邮件通知未启用，跳过发送');
      return;
    }

    try {
      if (emailConfig.provider === 'smtp' && emailConfig.smtp) {
        await this.sendViaSMTP(emailConfig.smtp, options);
        console.log(`邮件已通过SMTP发送至: ${options.to}`);
      } else if (emailConfig.provider === 'resend' && emailConfig.resend) {
        await this.sendViaResend(emailConfig.resend, options);
        console.log(`邮件已通过Resend发送至: ${options.to}`);
      } else {
        throw new Error('邮件配置不完整');
      }
    } catch (error) {
      console.error('邮件发送失败:', error);
      throw error;
    }
  }

  /**
   * 发送测试邮件
   */
  static async sendTestEmail(
    emailConfig: AdminConfig['EmailConfig'],
    toEmail: string,
    siteName?: string
  ): Promise<void> {
    const displayName = siteName || 'MoonTVPlus';
    await this.send(emailConfig, {
      to: toEmail,
      subject: `测试邮件 - ${displayName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background: white;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              background: white;
              color: #333;
              padding: 30px 20px;
              text-align: center;
              border-bottom: 2px solid #f0f0f0;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 30px 20px;
              background: white;
            }
            .content p {
              color: #333;
              margin: 10px 0;
            }
            .footer {
              padding: 20px;
              text-align: center;
              color: #999;
              font-size: 12px;
              background: white;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 测试邮件</h1>
            </div>
            <div class="content">
              <p>这是一封来自 ${displayName} 的测试邮件。</p>
              <p>如果您收到这封邮件，说明邮件配置正确！</p>
              <p style="color: #666;">发送时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>
            </div>
            <div class="footer">
              <p>此邮件由 ${displayName} 自动发送</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}
