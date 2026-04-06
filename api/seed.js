// api/seed.js
import bcrypt from 'bcryptjs';
import { getDb } from './_lib/db.js';

const defaultUsers = [
    {
        firstName: 'Demo',
        lastName: 'Individual',
        phone: '+910000000001',
        email: 'individual@finflow.com',
        password: 'Demo@1234',
        userType: 'individual',
        collection: 'individual_users'
    },
    {
        firstName: 'Demo',
        lastName: 'SME',
        phone: '+910000000002',
        email: 'sme@finflow.com',
        password: 'Demo@1234',
        userType: 'sme',
        collection: 'sme_users'
    }
];

export default async function handler(req, res) {
    // 🔒 Security: only allow if secret key matches
    const { secret } = req.query;
    if (secret !== process.env.SEED_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Pass ?secret=YOUR_SECRET in the URL.' });
    }

    try {
        const db = await getDb();
        const results = [];

        for (const user of defaultUsers) {
            const col = db.collection(user.collection);
            const exists = await col.findOne({ email: user.email });

            if (exists) {
                results.push({ email: user.email, status: 'already exists, skipped' });
                continue;
            }

            const passwordHash = await bcrypt.hash(user.password, 12);
            await col.insertOne({
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                email: user.email,
                passwordHash,
                userType: user.userType,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            results.push({ email: user.email, status: '✅ created' });
        }

        return res.status(200).json({ success: true, results });

    } catch (err) {
        console.error('Seed error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
}