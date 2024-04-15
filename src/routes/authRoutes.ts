import express from 'express';
import { AuthController } from '../controllers/authController';

const router = express.Router();

// Registration route
router.post('/register', AuthController.register);

// Login route
router.post('/login', AuthController.login);

// Route to send reset token
router.post('/send-reset-token', AuthController.sendResetToken);

// Route to reset password
router.post('/reset-password', AuthController.resetPassword);

// Check auth
router.post('/check-auth', AuthController.checkAuth);

export default router;
