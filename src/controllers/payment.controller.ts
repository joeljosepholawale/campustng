import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// In a real app, these come from your .env
const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-dummy-secret-key';
const FRONTEND_URL = process.env.FRONTEND_URL || 'campustrade://';

// Initialize a payment for boosting a product
export const initializeBoostPayment = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const { productId, planId } = req.body;

        if (!productId || !planId) {
            return res.status(400).json({ message: 'productId and planId are required' });
        }

        // Verify product owner
        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: { user: true }
        });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.userId !== userId) {
            return res.status(403).json({ message: 'You can only boost your own products' });
        }

        // Get plan
        const plan = await prisma.boostPlan.findUnique({
            where: { id: planId }
        });

        if (!plan) {
            return res.status(404).json({ message: 'Boost plan not found' });
        }

        // Generate unique transaction reference
        const tx_ref = `boost-${productId}-${planId}-${Date.now()}`;

        // Create pending transaction record
        await prisma.transaction.create({
            data: {
                reference: tx_ref,
                amount: plan.price,
                status: 'pending',
                type: 'boost',
                userId: userId,
                productId: productId
            }
        });

        const payload = {
            tx_ref,
            amount: plan.price.toString(),
            currency: 'NGN',
            redirect_url: `${FRONTEND_URL}payment-callback`,
            payment_options: 'card, banktransfer, ussd',
            customer: {
                email: product.user.email,
                name: `${product.user.firstName || ''} ${product.user.lastName || ''}`.trim() || 'User',
            },
            customizations: {
                title: 'UniMarket Boost',
                description: `Boost ${product.title} for ${plan.durationDays} days`,
                logo: 'https://ucarecdn.com/4cc73cb0-a0aa-4780-b2b9-eefbe672e12f/icon.png' // Replace with your logo
            }
        };

        const response = await fetch("https://api.flutterwave.com/v3/payments", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status === 'success') {
            return res.status(200).json({ link: data.data.link });
        } else {
            console.error('Flutterwave Initialization Error:', data);
            return res.status(500).json({ message: 'Failed to initialize payment', details: data.message });
        }

    } catch (error) {
        console.error('Boost payment init error:', error);
        res.status(500).json({ message: 'Server error initializing payment' });
    }
};


