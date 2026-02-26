import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

// Configure Cloudinary (MVP: Use placeholder credentials, the User should set these in .env later)
// Try to load from env, otherwise fail gracefully so server doesn't crash
try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
        api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
        api_secret: process.env.CLOUDINARY_API_SECRET || 'abcde-fghij-klmno-pqrst',
    });
} catch (e) {
    console.error("Cloudinary configuration failed", e);
}

// Multer config - store file in memory to send directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

router.post('/', protect, upload.single('image'), async (req: express.Request, res: express.Response): Promise<any> => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Convert the buffer to a base64 string to send to Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'campustradeng_uploads',
            resource_type: 'auto',
            transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ]
        });

        res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Failed to upload image', error: error.message });
    }
});

export default router;
