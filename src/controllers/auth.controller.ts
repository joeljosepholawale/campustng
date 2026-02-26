import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { sendPasswordResetEmail, sendWelcomeEmail, sendVerificationEmail } from '../utils/emailService';
import { isDisposableEmail, isValidEmailFormat } from '../utils/disposableEmails';

const prisma = new PrismaClient();

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { email, password, firstName, lastName, matricNumber, schoolId } = req.body;

        // Validate request
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        if (!isValidEmailFormat(email)) {
            return res.status(400).json({ message: 'Please provide a valid email format' });
        }

        if (isDisposableEmail(email)) {
            return res.status(400).json({ message: 'Please use a permanent, personal or school email address. Disposable emails are not allowed.' });
        }

        // Check if user already exists
        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a 4-digit verification code
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                hashedPassword,
                firstName,
                lastName,
                matricNumber,
                schoolId: schoolId ? parseInt(schoolId.toString()) : undefined,
                level: verificationCode, // MVP: store code temporarily in level field
            },
            include: { school: true }
        });

        // Generate token
        const token = generateToken({ id: user.id, email: user.email });

        // Send verification email before responding so serverless functions don't freeze
        try {
            await sendVerificationEmail(user.email, verificationCode);
        } catch (err) {
            console.warn('Verification email failed (non-blocking):', err);
        }

        res.status(201).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin,
            schoolId: user.schoolId,
            school: user.school,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate request
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
            include: { school: true }
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.hashedPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateToken({ id: user.id, email: user.email });

        res.status(200).json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isVerified: user.isVerified,
            isAdmin: user.isAdmin,
            bio: user.bio,
            profilePhotoUrl: user.profilePhotoUrl,
            storeName: user.storeName,
            storeBannerUrl: user.storeBannerUrl,
            schoolId: user.schoolId,
            school: user.school,
            token,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                matricNumber: true,
                profilePhotoUrl: true,
                level: true,
                department: true,
                bio: true,
                isVerified: true,
                createdAt: true,
                school: true,
                storeName: true,
                storeBannerUrl: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                    }
                },
                products: true,
                services: true,
                requests: true,
                reviewsReceived: true,
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { firstName, lastName, bio, profilePhotoUrl } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                bio,
                profilePhotoUrl,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                matricNumber: true,
                profilePhotoUrl: true,
                level: true,
                department: true,
                bio: true,
                isVerified: true,
                createdAt: true,
                school: true,
                storeName: true,
                storeBannerUrl: true,
                products: true,
                services: true,
                requests: true,
            }
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { code } = req.body;

        if (!code || code.length !== 4) {
            return res.status(400).json({ message: 'Invalid verification code format' });
        }

        // Fetch the user to check the code
        const userCheck = await prisma.user.findUnique({ where: { id: userId } });
        if (!userCheck) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userCheck.level !== code) {
            return res.status(400).json({ message: 'Incorrect verification code' });
        }

        // Code matches, verify user and clear the temporary OTP field
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                isVerified: true,
                level: null // Clear the OTP
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                matricNumber: true,
                profilePhotoUrl: true,
                level: true,
                department: true,
                bio: true,
                isVerified: true,
                createdAt: true,
                school: true,
            }
        });

        // Send welcome email before responding (serverless compatibility)
        try {
            await sendWelcomeEmail(user.email, user.firstName || 'Student');
        } catch (err) {
            console.warn('Welcome email failed (non-blocking):', err);
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error verifying email' });
    }
};

export const resendVerification = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        // Generate a new 4-digit verification code
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();

        await prisma.user.update({
            where: { id: userId },
            data: { level: verificationCode } // MVP: store code temporarily in level field
        });

        // Send verification email before responding (serverless compatibility)
        try {
            await sendVerificationEmail(user.email, verificationCode);
        } catch (err) {
            console.warn('Resend verification email failed (non-blocking):', err);
        }

        res.status(200).json({ message: 'Verification code resent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error resending verification code' });
    }
};

export const updatePushToken = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { expoPushToken } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { expoPushToken },
            select: {
                id: true,
                email: true,
                expoPushToken: true
            }
        });

        res.status(200).json({ message: 'Push token updated', expoPushToken: updatedUser.expoPushToken });
    } catch (error) {
        console.error('Error updating push token:', error);
        res.status(500).json({ message: 'Server error updating push token' });
    }
};

// Report a user (MVP: just log and acknowledge)
export const reportUser = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { reportedUserId, reason } = req.body;

        if (!reportedUserId || !reason) {
            return res.status(400).json({ message: 'reportedUserId and reason are required' });
        }

        // Save to the Reports table
        await prisma.report.create({
            data: {
                reporterId: userId,
                reportedUserId: reportedUserId,
                reason,
            }
        });

        console.log(`[REPORT] User ${userId} reported user ${reportedUserId}. Reason: ${reason}`);

        res.json({ message: 'Report submitted. Our team will review it.' });
    } catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ message: 'Server error submitting report' });
    }
};

// Get public profile of any user
export const getPublicUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id as string) },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                bio: true,
                profilePhotoUrl: true,
                createdAt: true,
                school: true,
                storeName: true,
                storeBannerUrl: true,
                isIdVerified: true,
                _count: {
                    select: {
                        followers: true,
                        following: true,
                    }
                },
                products: {
                    where: { isActive: true },
                    include: { category: true },
                    orderBy: { createdAt: 'desc' },
                },
                services: {
                    where: { isActive: true },
                    orderBy: { createdAt: 'desc' },
                },
                reviewsReceived: {
                    include: {
                        reviewer: {
                            select: { id: true, firstName: true, lastName: true, isIdVerified: true }
                        }
                    }
                },
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if current user follows this user
        let isFollowing = false;
        const currentUserId = (req as any).user?.id;
        if (currentUserId) {
            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: user.id
                    }
                }
            });
            isFollowing = !!follow;
        }

        res.json({ ...user, isFollowing });
    } catch (error) {
        console.error('Error fetching public user:', error);
        res.status(500).json({ message: 'Server error fetching user profile' });
    }
};

// Forgot password: generate a 6-digit reset code (MVP uses user.level field to store it temporarily)
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Please provide your email address' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if user exists — always return success
            return res.json({ message: 'If this email is registered, a reset code has been sent.' });
        }

        // Generate 6-digit code
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store the code temporarily (MVP: using level field; production would use a dedicated table)
        await prisma.user.update({
            where: { email },
            data: { level: `RESET:${resetCode}` },
        });

        // Send the code via email (Brevo or Resend)
        const emailSent = await sendPasswordResetEmail(email, resetCode);
        console.log(`[PASSWORD RESET] Code for ${email}: ${resetCode} | Email sent: ${emailSent}`);

        res.json({
            message: 'If this email is registered, a reset code has been sent.',
            // Only include dev code if email failed (for local testing)
            ...(!emailSent && { _devCode: resetCode })
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
};

// Reset password: verify code and set new password
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'Email, code, and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.level !== `RESET:${code}`) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { email },
            data: {
                hashedPassword,
                level: null, // Clear the reset code
            },
        });

        res.json({ message: 'Password reset successful. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
};
