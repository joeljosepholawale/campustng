import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all requests
export const getRequests = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const requests = await prisma.request.findMany({
            where: { isActive: true },
            take: limit,
            skip: skip,
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, school: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(requests);
    } catch (error) {
        console.error('getRequests error:', error);
        res.status(500).json({ message: 'Failed to fetch requests' });
    }
};

// Get a single request
export const getRequestById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const request = await prisma.request.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, school: true }
                }
            },
        });

        if (!request) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }

        res.json(request);
    } catch (error) {
        console.error('getRequestById error:', error);
        res.status(500).json({ message: 'Failed to fetch request' });
    }
};

// Create a request
export const createRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, budget } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const request = await prisma.request.create({
            data: {
                title,
                description,
                budget: Number(budget),
                userId,
            },
            include: { user: { select: { id: true, firstName: true, lastName: true } } }
        });

        res.status(201).json(request);
    } catch (error) {
        console.error('createRequest error:', error);
        res.status(500).json({ message: 'Failed to create request' });
    }
};

// Delete a request (owner only)
export const deleteRequest = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const request = await prisma.request.findUnique({ where: { id: parseInt(id) } });

        if (!request) {
            res.status(404).json({ message: 'Request not found' });
            return;
        }

        if (request.userId !== userId) {
            res.status(403).json({ message: 'Not authorized to delete this request' });
            return;
        }

        await prisma.request.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        console.error('deleteRequest error:', error);
        res.status(500).json({ message: 'Failed to delete request' });
    }
};
