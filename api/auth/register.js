// api/auth/register.js
// Vercel serverless function — POST /api/auth/register
// Creates a new user in MongoDB (hashes password with bcrypt).
//
// 
// Required environment variables (set in Vercel dashboard):
//   MONGODB_URI  — e.g. mongodb+srv://user:pass@cluster.mongodb.net/finflow

import bcrypt from 'bcryptjs';
import { getDb } from '../_lib/db.js';

function validatePassword(p) {
    if (p.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(p)) return 'Password needs at least one uppercase letter.';
    if (!/[a-z]/.test(p)) return 'Password needs at least one lowercase letter.';
    if (!/\d/.test(p)) return 'Password needs at least one digit.';
    if (!/[^A-Za-z0-9]/.test(p)) return 'Password needs at least one special character.';
    return null;
}

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

    const { firstName, lastName, phone, email, password, userType } = req.body;

    if (!firstName || !lastName || !phone || !email || !password || !userType) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const collectionName = resolveUserCollectionName(userType);
    if (!collectionName) {
        return res.status(400).json({ success: false, message: "Invalid userType. Use 'individual' or 'sme'." });
    }

    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ success: false, message: pwError });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address.' });
    }

    try {
        const db = await getDb();

        const usersCollection = db.collection(collectionName);
        await usersCollection.createIndex({ email: 1 }, { unique: true });

        const existing = await usersCollection.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const newUser = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            userType,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            user: {
                id: result.insertedId,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                userType
            }
        });

    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ success: false, message: err.message || 'Server error. Please try again later.' });
    }
}
