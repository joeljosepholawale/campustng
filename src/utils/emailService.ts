/**
 * Switchable Email Service — supports Brevo (default) and Resend.
 * 
 * Set EMAIL_PROVIDER in .env to 'brevo' or 'resend'.
 * Brevo:  requires BREVO_API_KEY  (300 emails/day free)
 * Resend: requires RESEND_API_KEY (3,000 emails/month free)
 */

import { Resend } from 'resend';

// ─── Configuration ──────────────────────────
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'brevo';
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'CampusTrade';
const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS || 'noreply@campustrade.ng';

// ─── Resend Instance ────────────────────────
let resendClient: Resend | null = null;

function getResendClient() {
    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY || '');
    }
    return resendClient;
}

// ─── Core Send Function ─────────────────────
interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
    const provider = EMAIL_PROVIDER.toLowerCase();
    console.log(`[EMAIL] Sending via ${provider} to ${options.to}: "${options.subject}"`);

    try {
        if (provider === 'resend') {
            return await sendViaResend(options);
        } else {
            return await sendViaBrevo(options);
        }
    } catch (error) {
        console.error(`[EMAIL] Failed to send via ${provider}:`, error);
        return false;
    }
}

// ─── Brevo Implementation (direct HTTP) ─────
async function sendViaBrevo(options: EmailOptions): Promise<boolean> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey || apiKey === 'your-brevo-api-key-here') {
        console.warn('[EMAIL] Brevo API key not set — skipping email send');
        return false;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            sender: { name: FROM_NAME, email: FROM_EMAIL },
            to: [{ email: options.to }],
            subject: options.subject,
            htmlContent: options.html,
            ...(options.text && { textContent: options.text }),
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('[EMAIL] Brevo error:', response.status, errorBody);
        return false;
    }

    const result = await response.json();
    console.log('[EMAIL] Brevo response:', JSON.stringify(result));
    return true;
}

// ─── Resend Implementation ──────────────────
async function sendViaResend(options: EmailOptions): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || apiKey === 'your-resend-api-key-here') {
        console.warn('[EMAIL] Resend API key not set — skipping email send');
        return false;
    }

    const client = getResendClient();
    const result = await client.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [options.to],
        subject: options.subject,
        html: options.html,
    });

    console.log('[EMAIL] Resend response:', result);
    return true;
}

// ─────────────────────────────────────────────
// 🎨  PREMIUM EMAIL TEMPLATES
// ─────────────────────────────────────────────

const baseWrapper = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CampusTrade</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080E1A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #080E1A;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">
                    ${content}
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 24px 16px; text-align: center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #64748B; text-decoration: none; font-size: 12px;">Help</a>
                                    </td>
                                    <td style="color: #334155; padding: 0 4px;">•</td>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #64748B; text-decoration: none; font-size: 12px;">Privacy</a>
                                    </td>
                                    <td style="color: #334155; padding: 0 4px;">•</td>
                                    <td style="padding: 0 8px;">
                                        <a href="#" style="color: #64748B; text-decoration: none; font-size: 12px;">Terms</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 24px 32px; text-align: center;">
                            <p style="margin: 0; color: #334155; font-size: 11px; line-height: 1.5;">
                                &copy; ${new Date().getFullYear()} CampusTrade. All rights reserved.<br>
                                Your trusted campus marketplace.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;


// ─── 🔑 Password Reset Email ────────────────

export async function sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
    const html = baseWrapper(`
        <!-- Gradient Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #0F766E 0%, #14B8A6 50%, #2DD4BF 100%); border-radius: 20px 20px 0 0; padding: 48px 32px 40px; text-align: center;">
                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 16px; line-height: 64px; font-size: 28px;">🔐</div>
                <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Password Reset</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">CampusTrade</p>
            </td>
        </tr>

        <!-- Body Card -->
        <tr>
            <td style="background-color: #0F172A; padding: 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <!-- Message -->
                    <tr>
                        <td style="padding: 36px 32px 16px;">
                            <p style="margin: 0; color: #CBD5E1; font-size: 15px; line-height: 1.7;">
                                We received a request to reset your password. Enter the code below in the app to continue:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Code Box -->
                    <tr>
                        <td style="padding: 8px 32px 8px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background: linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0.15) 100%); border: 2px solid rgba(20,184,166,0.3); border-radius: 16px; padding: 28px 24px; text-align: center;">
                                        <p style="margin: 0 0 6px; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Reset Code</p>
                                        <p style="margin: 0; color: #14B8A6; font-size: 42px; font-weight: 800; letter-spacing: 12px; font-variant-numeric: tabular-nums;">${code}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Timer Warning -->
                    <tr>
                        <td style="padding: 16px 32px 8px; text-align: center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto; background: rgba(251,146,60,0.1); border-radius: 8px; padding: 10px 20px;">
                                <tr>
                                    <td style="padding: 10px 20px;">
                                        <p style="margin: 0; color: #FB923C; font-size: 13px; font-weight: 600;">⏱ This code expires in 15 minutes</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Security Note -->
                    <tr>
                        <td style="padding: 24px 32px 36px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #1E293B;">
                                <tr>
                                    <td style="padding-top: 24px;">
                                        <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
                                            🛡️ <strong style="color: #64748B;">Didn't request this?</strong> You can safely ignore this email. Your password will remain unchanged.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Bottom Border -->
        <tr>
            <td style="background: linear-gradient(135deg, #0F766E, #14B8A6, #2DD4BF); height: 4px; border-radius: 0 0 20px 20px; font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>
    `);

    return sendEmail({
        to,
        subject: `${code} — Your CampusTrade Password Reset Code`,
        html,
        text: `Your CampusTrade password reset code is: ${code}. This code expires in 15 minutes. If you didn't request this, please ignore this email.`,
    });
}


// ─── 👋 Welcome Email ───────────────────────

export async function sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    const html = baseWrapper(`
        <!-- Gradient Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #0F766E 0%, #14B8A6 50%, #2DD4BF 100%); border-radius: 20px 20px 0 0; padding: 48px 32px 40px; text-align: center;">
                <div style="width: 80px; height: 80px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 80px; font-size: 40px;">👋</div>
                <h1 style="margin: 0; color: #FFFFFF; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Welcome, ${firstName}!</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">You've joined CampusTrade 🎓</p>
            </td>
        </tr>

        <!-- Body Card -->
        <tr>
            <td style="background-color: #0F172A; padding: 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <!-- Intro -->
                    <tr>
                        <td style="padding: 36px 32px 24px;">
                            <p style="margin: 0; color: #CBD5E1; font-size: 15px; line-height: 1.7;">
                                You're now part of <strong style="color: #F1F5F9;">the largest student marketplace</strong> on your campus. Here's everything you can do:
                            </p>
                        </td>
                    </tr>

                    <!-- Feature 1: Buy & Sell -->
                    <tr>
                        <td style="padding: 0 32px 6px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #1E293B; border-radius: 14px;">
                                <tr>
                                    <td width="56" style="padding: 18px 0 18px 18px; vertical-align: middle;">
                                        <div style="width: 44px; height: 44px; background: rgba(96,165,250,0.15); border-radius: 12px; text-align: center; line-height: 44px; font-size: 20px;">📚</div>
                                    </td>
                                    <td style="padding: 18px 18px 18px 14px; vertical-align: middle;">
                                        <p style="margin: 0 0 2px; color: #F1F5F9; font-size: 14px; font-weight: 700;">Buy & Sell</p>
                                        <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.4;">Textbooks, electronics, furniture — list anything or find great deals</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Feature 2: Offer Services -->
                    <tr>
                        <td style="padding: 0 32px 6px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #1E293B; border-radius: 14px;">
                                <tr>
                                    <td width="56" style="padding: 18px 0 18px 18px; vertical-align: middle;">
                                        <div style="width: 44px; height: 44px; background: rgba(168,85,247,0.15); border-radius: 12px; text-align: center; line-height: 44px; font-size: 20px;">💼</div>
                                    </td>
                                    <td style="padding: 18px 18px 18px 14px; vertical-align: middle;">
                                        <p style="margin: 0 0 2px; color: #F1F5F9; font-size: 14px; font-weight: 700;">Offer Services</p>
                                        <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.4;">Tutoring, graphic design, hair styling — monetize your skills</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Feature 3: Direct Chat -->
                    <tr>
                        <td style="padding: 0 32px 6px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #1E293B; border-radius: 14px;">
                                <tr>
                                    <td width="56" style="padding: 18px 0 18px 18px; vertical-align: middle;">
                                        <div style="width: 44px; height: 44px; background: rgba(52,211,153,0.15); border-radius: 12px; text-align: center; line-height: 44px; font-size: 20px;">💬</div>
                                    </td>
                                    <td style="padding: 18px 18px 18px 14px; vertical-align: middle;">
                                        <p style="margin: 0 0 2px; color: #F1F5F9; font-size: 14px; font-weight: 700;">Real-Time Chat</p>
                                        <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.4;">Message buyers and sellers directly — no middlemen, no delays</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Feature 4: Reviews -->
                    <tr>
                        <td style="padding: 0 32px 6px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #1E293B; border-radius: 14px;">
                                <tr>
                                    <td width="56" style="padding: 18px 0 18px 18px; vertical-align: middle;">
                                        <div style="width: 44px; height: 44px; background: rgba(251,191,36,0.15); border-radius: 12px; text-align: center; line-height: 44px; font-size: 20px;">⭐</div>
                                    </td>
                                    <td style="padding: 18px 18px 18px 14px; vertical-align: middle;">
                                        <p style="margin: 0 0 2px; color: #F1F5F9; font-size: 14px; font-weight: 700;">Build Reputation</p>
                                        <p style="margin: 0; color: #94A3B8; font-size: 12px; line-height: 1.4;">Earn reviews and become a trusted trader on campus</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 28px 32px 36px; text-align: center;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #0F766E, #14B8A6); border-radius: 14px; padding: 16px 48px;">
                                        <a href="#" style="color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; display: block;">
                                            Open CampusTrade →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 14px 0 0; color: #475569; font-size: 12px;">
                                Start listing your first item today!
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Bottom Border -->
        <tr>
            <td style="background: linear-gradient(135deg, #0F766E, #14B8A6, #2DD4BF); height: 4px; border-radius: 0 0 20px 20px; font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>
    `);

    return sendEmail({
        to,
        subject: `Welcome to CampusTrade, ${firstName}! 🎓`,
        html,
        text: `Welcome to CampusTrade, ${firstName}! You've joined the largest student marketplace on your campus. Buy & sell textbooks, electronics, furniture. Offer services like tutoring and design. Chat directly with buyers and sellers. Build your campus reputation with reviews. Open the CampusTrade app to get started!`,
    });
}


// ─── ✉️ Email Verification ──────────────────

export async function sendVerificationEmail(to: string, code: string): Promise<boolean> {
    const html = baseWrapper(`
        <!-- Gradient Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #0F766E 0%, #14B8A6 50%, #2DD4BF 100%); border-radius: 20px 20px 0 0; padding: 48px 32px 40px; text-align: center;">
                <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 16px; line-height: 64px; font-size: 28px;">✉️</div>
                <h1 style="margin: 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Verify Your Email</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">CampusTrade</p>
            </td>
        </tr>

        <!-- Body Card -->
        <tr>
            <td style="background-color: #0F172A; padding: 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding: 36px 32px 16px;">
                            <p style="margin: 0; color: #CBD5E1; font-size: 15px; line-height: 1.7;">
                                Thanks for signing up! Enter the code below in the app to verify your email and unlock all features:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Code Box -->
                    <tr>
                        <td style="padding: 8px 32px 8px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background: linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0.15) 100%); border: 2px solid rgba(20,184,166,0.3); border-radius: 16px; padding: 28px 24px; text-align: center;">
                                        <p style="margin: 0 0 6px; color: #94A3B8; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verification Code</p>
                                        <p style="margin: 0; color: #14B8A6; font-size: 42px; font-weight: 800; letter-spacing: 12px; font-variant-numeric: tabular-nums;">${code}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 24px 32px 36px;">
                            <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
                                If you didn't create a CampusTrade account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>

        <!-- Bottom Border -->
        <tr>
            <td style="background: linear-gradient(135deg, #0F766E, #14B8A6, #2DD4BF); height: 4px; border-radius: 0 0 20px 20px; font-size: 0; line-height: 0;">&nbsp;</td>
        </tr>
    `);

    return sendEmail({
        to,
        subject: `${code} — Verify your CampusTrade account`,
        html,
        text: `Your CampusTrade verification code is: ${code}. Enter this code in the app to verify your email address.`,
    });
}
