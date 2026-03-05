import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const configController = {
    getAppVersion: async (req: Request, res: Response) => {
        try {
            let config = await prisma.appConfig.findFirst();

            // If no config exists yet, create the default one.
            if (!config) {
                config = await prisma.appConfig.create({
                    data: {
                        latestAndroidVersion: '1.0.0',
                        minAndroidVersion: '1.0.0',
                        latestIosVersion: '1.0.0',
                        minIosVersion: '1.0.0',
                        playStoreUrl: 'https://play.google.com/store/apps/details?id=com.campustradeng.app',
                        appStoreUrl: 'https://apps.apple.com/us/app/campustradeng/id1234567890'
                    }
                });
            }

            res.json(config);
        } catch (error) {
            console.error('Error fetching app configuration:', error);
            res.status(500).json({ message: 'Server error fetching configuration', error: String(error) });
        }
    }
};
