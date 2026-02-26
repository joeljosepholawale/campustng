import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /schools — public, returns all approved schools
router.get('/', async (req: Request, res: Response) => {
    try {
        const { search, state, type } = req.query;

        // Temporarily check all schools regardless of approval status
        const where: any = {};

        if (search) {
            where.name = { contains: search as string };
        }
        if (state) {
            where.state = state as string;
        }
        if (type) {
            where.type = type as string;
        }

        const schools = await prisma.school.findMany({
            where,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                type: true,
                state: true,
                city: true,
                logoUrl: true,
            },
        });

        res.json(schools);
    } catch (error) {
        console.error('Failed to fetch schools:', error);
        res.status(500).json({ message: 'Failed to fetch schools' });
    }
});

export default router;
