import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import crypto from 'crypto';
import { JwtPayloadWithRole } from '../middlewares/types';

const prisma = new PrismaClient();
const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';

export const AuthService = {
    hashPassword: async (password: string) => {
        return await bcrypt.hash(password, 8);
    },

    validatePassword: async (enteredPassword: string, userPassword: string) => {
        return await bcrypt.compare(enteredPassword, userPassword);
    },

    generateToken: (userId: string, userRole: string) => {
        return jwt.sign({ id: userId, role: userRole }, secretKey, { expiresIn: '1h' });
    },

    verifyToken: (token: string): JwtPayloadWithRole => {
        return jwt.verify(token, secretKey) as JwtPayloadWithRole;
    },

    getUserByEmail: async (email: string) => {
        return await prisma.user.findUnique({ where: { email } });
    },

    generateResetToken: async (email: string) => {
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

        await prisma.user.update({
            where: { email },
            data: { resetToken, resetTokenExpiry },
        });

        // Here, you would typically send the resetToken to the user's email
        // For simplicity, we'll just return the token here
        return resetToken;
    },

    resetPassword: async (resetToken: string, newPassword: string) => {
        const hashedPassword = await bcrypt.hash(newPassword, 8);

        await prisma.user.update({
            where: { resetToken },
            data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
        });
    },
    // Other auth related functions...
};
