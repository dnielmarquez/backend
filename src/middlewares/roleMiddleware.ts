import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';

export const roleMiddleware = (roles: string[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.headers.authorization?.split(' ')[1] || '';
            const decoded = AuthService.verifyToken(token);

            if (!roles.includes(decoded.role)) {
                return res.status(403).json({ message: 'Access denied' });
            }

            next();
        } catch (error: any) {
            res.status(401).json({ message: 'Not authorized', error: error.message });
        }
    };
};
