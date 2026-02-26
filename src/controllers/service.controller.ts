import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all services
export const getServices = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = req.query.page ? parseInt(req.query.page as string) : 1;
        const limit = 50;
        const skip = (page - 1) * limit;

        const services = await prisma.service.findMany({
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
        res.json(services);
    } catch (error) {
        console.error('getServices error:', error);
        res.status(500).json({ message: 'Failed to fetch services' });
    }
};
// Get a single service
export const getServiceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(req.params.id as string);
        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, firstName: true, lastName: true, school: true }
                }
            },
        });

        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }

        res.json(service);
    } catch (error) {
        console.error('getServiceById error:', error);
        res.status(500).json({ message: 'Failed to fetch service' });
    }
};

// Create a service
export const createService = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, price, imageUrl } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const service = await prisma.service.create({
            data: {
                title,
                description,
                price: Number(price),
                imageUrl,
                userId,
            },
            include: { user: { select: { id: true, firstName: true, lastName: true } } }
        });

        res.status(201).json(service);
    } catch (error) {
        console.error('createService error:', error);
        res.status(500).json({ message: 'Failed to create service' });
    }
};

// Delete a service (owner only)
export const deleteService = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const userId = (req as any).user?.id;

        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const service = await prisma.service.findUnique({ where: { id: parseInt(id) } });

        if (!service) {
            res.status(404).json({ message: 'Service not found' });
            return;
        }

        if (service.userId !== userId) {
            res.status(403).json({ message: 'Not authorized to delete this service' });
            return;
        }

        await prisma.service.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        console.error('deleteService error:', error);
        res.status(500).json({ message: 'Failed to delete service' });
    }
};
