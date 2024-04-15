import express from 'express';
import { UserController } from '../controllers/userController';
import { roleMiddleware } from '../middlewares/roleMiddleware';
const router = express.Router();

// Middleware to restrict access to admins only
const adminOnly = roleMiddleware(['ADMIN']);

// Get all users - Only accessible by admin
router.get('/', adminOnly, UserController.getAllUsers);

// Get a single user by ID
router.get('/:id', UserController.getUserById);

// Get a single user by Role
router.get('/byRole/:role', UserController.getUsersByRole);

// Update a user
router.put('/:id', UserController.updateUser);

// Update a user
router.get('/approve/:id', adminOnly, UserController.approveUser);


export default router;
