// api/auth/login.js
// Vercel serverless function — POST /api/auth/login
// Verifies email + password against MongoDB and returns success/failure.
// Required environment variables (set in Vercel dashboard):
//   MONGODB_URI  — e.g. mongodb+srv://user:pass@cluster.mongodb.net/finflow
//   JWT_SECRET   — any long random string for signing tokens (optional but recommended)

import bcrypt from 'bcryptjs';
import { getDb } from '../_lib/db.js';

function resolveUserCollectionName(userType) {
    if (userType === 'individual') return 'individual_users';
    if (userType === 'sme') return 'sme_users';
    return null;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
        return res.status(400).json({ success: false, message: 'Email, password and userType are required.' });
    }

    const collectionName = resolveUserCollectionName(userType);
    if (!collectionName) {
        return res.status(400).json({ success: false, message: "Invalid userType. Use 'individual' or 'sme'." });
    }

    try {
        const db = await getDb();
        const usersCollection = db.collection(collectionName);
        await usersCollection.createIndex({ email: 1 }, { unique: true });

        const user = await usersCollection.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(401).json({ success: false, message: 'No account found with this email address.' });

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatch) return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Server error. Please try again later.' });
    }
}
