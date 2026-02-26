import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import messageRoutes from './routes/message.routes';

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic landing route
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('<h1>CampusTradeNG API</h1><p>The backend is live and running.</p>');
});

// Default health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

import serviceRoutes from './routes/service.routes';
import requestRoutes from './routes/request.routes';
import reviewRoutes from './routes/review.routes';
import adminRoutes from './routes/admin.routes';
import uploadRoutes from './routes/upload.routes';
import schoolRoutes from './routes/school.routes';
import analyticsRoutes from './routes/analytics.routes';
import communityRoutes from './routes/community.routes';
import userRoutes from './routes/user.routes';
import savedSearchRoutes from './routes/savedSearch.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';

// ... 

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/schools', schoolRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/saved-searches', savedSearchRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/notifications', notificationRoutes);

export default app;
