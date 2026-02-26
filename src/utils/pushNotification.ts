import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

/**
 * Send a push notification to a specific Expo push token.
 * Call this from your message controller or any event handler.
 */
export async function sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>
) {
    if (!Expo.isExpoPushToken(expoPushToken)) {
        console.warn(`Invalid Expo push token: ${expoPushToken}`);
        return;
    }

    const message: ExpoPushMessage = {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
    };

    try {
        const tickets = await expo.sendPushNotificationsAsync([message]);
        console.log('[PUSH] Sent notification:', tickets);
        return tickets;
    } catch (error) {
        console.error('[PUSH] Error sending notification:', error);
    }
}
