// A list of common disposable email domains to prevent spam accounts
export const DISPOSABLE_EMAIL_DOMAINS = new Set([
    'mailinator.com',
    '10minutemail.com',
    'guerrillamail.com',
    'temp-mail.org',
    'yopmail.com',
    'sharklasers.com',
    'dropmail.me',
    'throwawaymail.com',
    'tempmail.com',
    'tempmail.net',
    'dispostable.com',
    'getairmail.com',
    'trashmail.com',
    'maildrop.cc',
    'nada.email',
    'getnada.com',
    'mohmal.com',
    'mohmal.in',
    'tempail.com',
    'secmail.pro',
    'fextin.com',
    'lyfajm.com',
    'zainmax.net',
    'khtyler.com',
    'lyfajm.com',
    'inboxkitten.com'
]);

export function isDisposableEmail(email: string): boolean {
    if (!email || !email.includes('@')) return true;

    const parts = email.split('@');
    if (parts.length !== 2) return true;

    const domain = parts[1].toLowerCase().trim();
    return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function isValidEmailFormat(email: string): boolean {
    // Standard email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
