import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include the user
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = verifyToken(token);

            // Verify user still exists and is active
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });

            if (!user) {
                return res.status(401).json({ message: 'The user belonging to this token no longer exists' });
            }
            if (!user.isActive) {
                return res.status(401).json({ message: 'This account has been deactivated' });
            }

            // Add user payload to request
            req.user = decoded;

            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed or expired' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
