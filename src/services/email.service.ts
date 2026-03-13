import fs from 'fs';
import path from 'path';
import { emailTransporter, emailConfig } from '../config/email.config';
import { logger } from '../utils/logger';

interface WelcomeEmailData {
  email: string;
  firstName: string;
  temporaryPassword: string;
}

interface AllocationEmailData {
  email: string;
  firstName: string;
  lastName: string;
  schedules: Array<{
    batch_id: number;
    technology: string;
    start_date: string;
    end_date: string;
    venue: string;
  }>;
}

function loadTemplate(templateName: string): string {
  const templatePath = path.join(__dirname, '..', 'templates', 'email', templateName);
  return fs.readFileSync(templatePath, 'utf-8');
}

function renderTemplate(template: string, data: Record<string, string>): string {
  let rendered = template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    rendered = rendered.split(placeholder).join(value);
  });
  return rendered;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  try {
    const htmlTemplate = loadTemplate('welcome-user.html');
    const textTemplate = loadTemplate('welcome-user.txt');

    const templateData = {
      first_name: data.firstName,
      email: data.email,
      temporary_password: data.temporaryPassword,
      login_url: emailConfig.loginUrl,
    };

    const htmlContent = renderTemplate(htmlTemplate, templateData);
    const textContent = renderTemplate(textTemplate, templateData);

    await emailTransporter.sendMail({
      from: emailConfig.from,
      to: data.email,
      subject: 'Welcome to Training Schedule Management - Your Account Details',
      text: textContent,
      html: htmlContent,
    });

    logger.info('Welcome email sent successfully', {
      recipient: data.email,
      firstName: data.firstName,
    });
  } catch (error) {
    logger.error('Failed to send welcome email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      recipient: data.email,
    });
  }
}

export async function sendAllocationNotification(data: AllocationEmailData): Promise<void> {
  try {
    const htmlTemplate = loadTemplate('allocation-notification.html');
    const textTemplate = loadTemplate('allocation-notification.txt');

    const schedulesHtml = data.schedules
      .map(
        (schedule) => `
        <div class="schedule-card">
            <h3>Batch ${schedule.batch_id} - ${schedule.technology}</h3>
            <div class="schedule-detail">
                <strong>Start Date:</strong> ${schedule.start_date}
            </div>
            <div class="schedule-detail">
                <strong>End Date:</strong> ${schedule.end_date}
            </div>
            <div class="schedule-detail">
                <strong>Venue:</strong> ${schedule.venue}
            </div>
        </div>
    `
      )
      .join('');

    const schedulesText = data.schedules
      .map(
        (schedule) => `
----------------------------------------
Batch ${schedule.batch_id} - ${schedule.technology}
----------------------------------------
Start Date: ${schedule.start_date}
End Date: ${schedule.end_date}
Venue: ${schedule.venue}
`
      )
      .join('\n');

    const templateData = {
      first_name: data.firstName,
      last_name: data.lastName,
      schedules: schedulesHtml,
    };

    const textTemplateData = {
      first_name: data.firstName,
      last_name: data.lastName,
      schedules: schedulesText,
    };

    const htmlContent = renderTemplate(htmlTemplate, templateData);
    const textContent = renderTemplate(textTemplate, textTemplateData);

    await emailTransporter.sendMail({
      from: emailConfig.from,
      to: data.email,
      subject: 'Training Schedule Allocation Notification',
      text: textContent,
      html: htmlContent,
    });

    logger.info('Allocation notification email sent successfully', {
      recipient: data.email,
      scheduleCount: data.schedules.length,
    });
  } catch (error) {
    logger.error('Failed to send allocation notification email', {
      error: error instanceof Error ? error.message : 'Unknown error',
      recipient: data.email,
    });
  }
}
