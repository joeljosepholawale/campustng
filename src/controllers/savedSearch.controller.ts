import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all saved searches for the current user
export const getSavedSearches = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const savedSearches = await prisma.savedSearch.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(savedSearches);
    } catch (error) {
        console.error('Failed to get saved searches:', error);
        res.status(500).json({ message: 'Server error fetching saved searches' });
    }
};

// Create a new saved search
export const createSavedSearch = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { query, category } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Check if user already has an excessive amount of saved searches (e.g., max 20)
        const currentCount = await prisma.savedSearch.count({
            where: { userId }
        });

        if (currentCount >= 20) {
            return res.status(400).json({ message: 'You have reached the maximum number of saved searches (20). Please delete some to save more.' });
        }

        // Check for duplicates
        const existingSearch = await prisma.savedSearch.findFirst({
            where: {
                userId,
                query: { equals: query, mode: 'insensitive' },
                category: category || null
            }
        });

        if (existingSearch) {
            return res.status(400).json({ message: 'You already have this exact search saved.' });
        }

        // Create the saved search
        const savedSearch = await prisma.savedSearch.create({
            data: {
                query,
                category: category || null,
                userId
            }
        });

        res.status(201).json(savedSearch);
    } catch (error) {
        console.error('Failed to create saved search:', error);
        res.status(500).json({ message: 'Server error creating saved search' });
    }
};

// Delete a saved search
export const deleteSavedSearch = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const searchId = parseInt(req.params.id as string);

        // Verify the search belongs to the user
        const search = await prisma.savedSearch.findUnique({
            where: { id: searchId }
        });

        if (!search) {
            return res.status(404).json({ message: 'Saved search not found' });
        }

        if (search.userId !== userId) {
            return res.status(403).json({ message: 'You do not have permission to delete this saved search' });
        }

        await prisma.savedSearch.delete({
            where: { id: searchId }
        });

        res.json({ message: 'Saved search deleted successfully' });
    } catch (error) {
        console.error('Failed to delete saved search:', error);
        res.status(500).json({ message: 'Server error deleting saved search' });
    }
};
