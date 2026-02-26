import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Lazy instance of Expo to handle ESM/CommonJS issues on Vercel
let expoInstance: any = null;

const getExpoInstance = async () => {
    if (!expoInstance) {
        // Dynamic import because expo-server-sdk v6+ is an ESM package
        const { Expo } = await import('expo-server-sdk');
        expoInstance = new Expo();
    }
    return expoInstance;
};

interface PushPayload {
    userIds: number[];
    title: string;
    body: string;
    data?: any;
    // Internal DB Notification tracking params
    type?: string;
    saveToDb?: boolean;
}

export const sendPushNotification = async (payload: PushPayload) => {
    try {
        const { userIds, title, body, data, type = 'SYSTEM', saveToDb = true } = payload;

        // Dynamically get Expo and types safely
        const { Expo } = await import('expo-server-sdk');
        const expo = await getExpoInstance();

        // Fetch users to get their Expo push tokens
        const users = await prisma.user.findMany({
            where: {
                id: { in: userIds },
            },
            select: { id: true, expoPushToken: true }
        });

        const messages: any[] = []; // Using any[] to avoid strict type issues with dynamic imports
        const dbNotifications: any[] = [];

        for (const user of users) {
            // 1. Prepare physical push notification if valid token exists
            if (user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken)) {
                messages.push({
                    to: user.expoPushToken,
                    sound: 'default',
                    title,
                    body,
                    data
                });
            }

            // 2. Prepare internal DB notification
            if (saveToDb) {
                dbNotifications.push({
                    userId: user.id,
                    type,
                    title,
                    message: body,
                    data: data ? JSON.stringify(data) : null,
                });
            }
        }

        // 3. Save internal notifications to DB
        if (dbNotifications.length > 0) {
            await prisma.notification.createMany({
                data: dbNotifications
            });
        }

        // 4. Chunk & Send Push Notifications via Expo
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('Error sending Expo push chunk:', error);
            }
        }

        return { success: true, messagesSent: messages.length, dbSaved: dbNotifications.length };
    } catch (error) {
        console.error('sendPushNotification Error:', error);
        return { success: false, error };
    }
};
