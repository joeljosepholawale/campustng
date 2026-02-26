import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const communityController = {
    // Forums
    async getForums(req: Request, res: Response) {
        try {
            const category = req.query.category as string;
            const posts = await prisma.forumPost.findMany({
                where: category ? { category } : undefined,
                take: 100,
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, school: true, profilePhotoUrl: true } },
                    _count: { select: { comments: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(posts);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch forums' });
        }
    },

    async createForumPost(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { title, content, category } = req.body;
            const newPost = await prisma.forumPost.create({
                data: { title, content, category, userId },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, school: true, profilePhotoUrl: true } },
                    _count: { select: { comments: true } }
                }
            });
            res.status(201).json(newPost);
        } catch (error) {
            res.status(500).json({ message: 'Failed to create post' });
        }
    },

    async getForumComments(req: Request, res: Response) {
        try {
            const postId = parseInt(req.params.postId as string);
            const comments = await prisma.forumComment.findMany({
                where: { postId },
                take: 100,
                include: { user: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } } },
                orderBy: { createdAt: 'asc' }
            });
            res.json(comments);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch comments' });
        }
    },

    async addForumComment(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const postId = parseInt(req.params.postId as string);
            const { content } = req.body;
            const comment = await prisma.forumComment.create({
                data: { content, postId, userId }
            });
            res.status(201).json(comment);
        } catch (error) {
            res.status(500).json({ message: 'Failed to add comment' });
        }
    },

    // Study Groups
    async getStudyGroups(req: Request, res: Response) {
        try {
            const groups = await prisma.studyGroup.findMany({
                take: 100,
                include: {
                    creator: { select: { id: true, firstName: true, lastName: true, school: true } },
                    members: true,
                    _count: { select: { members: true } }
                }
            });
            res.json(groups);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch study groups' });
        }
    },

    async createStudyGroup(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { name, description, courseCode } = req.body;
            const group = await prisma.studyGroup.create({
                data: { name, description, courseCode, creatorId: userId },
                include: {
                    creator: { select: { id: true, firstName: true, lastName: true, school: true } },
                    _count: { select: { members: true } }
                }
            });
            // automatically join the creator
            await prisma.studyGroupMember.create({
                data: { groupId: group.id, userId }
            });

            // Re-fetch to get updated members count (should be 1 now)
            const finalGroup = await prisma.studyGroup.findUnique({
                where: { id: group.id },
                include: {
                    creator: { select: { id: true, firstName: true, lastName: true, school: true } },
                    members: true,
                    _count: { select: { members: true } }
                }
            });

            res.status(201).json(finalGroup);
        } catch (error) {
            res.status(500).json({ message: 'Failed to create group' });
        }
    },

    async joinStudyGroup(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const groupId = parseInt(req.params.groupId as string);
            const member = await prisma.studyGroupMember.create({
                data: { groupId, userId }
            });
            res.status(201).json(member);
        } catch (error) {
            res.status(500).json({ message: 'Failed to join group' });
        }
    },

    async getStudyGroupMessages(req: Request, res: Response) {
        try {
            const groupId = parseInt(req.params.groupId as string);
            const messages = await prisma.studyGroupMessage.findMany({
                where: { groupId },
                take: 100,
                include: { sender: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } } },
                orderBy: { createdAt: 'asc' }
            });
            res.json(messages);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch messages' });
        }
    },

    async sendStudyGroupMessage(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const groupId = parseInt(req.params.groupId as string);
            const { text } = req.body;

            // Optional: verify user is a member of the group before allowing them to send messages
            const isMember = await prisma.studyGroupMember.findUnique({
                where: {
                    groupId_userId: {
                        groupId,
                        userId
                    }
                }
            });

            if (!isMember) {
                return res.status(403).json({ message: 'You must be a member of this group to send messages' });
            }

            const message = await prisma.studyGroupMessage.create({
                data: { text, groupId, senderId: userId },
                include: { sender: { select: { id: true, firstName: true, lastName: true, profilePhotoUrl: true } } }
            });
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ message: 'Failed to send message' });
        }
    }
};
