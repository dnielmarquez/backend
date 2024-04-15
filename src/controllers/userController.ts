import { PrismaClient, UserRole } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const UserController = {
  getAllUsers: async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        include: {
          supplier: true,
        },
      });

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  },

  getUserById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          supplier: true,
        },
      });

      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
  },

  getUsersByRole: async (req: Request, res: Response) => {
    try {
      const role: UserRole = req.params.role as UserRole;
      const users = await prisma.user.findMany({
        where: { role },
        include: {
          supplier: true,
        },
      });

      if (users.length > 0) {
        res.json(users);
      } else {
        res.status(404).json({ message: 'Users not found' });
      }
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  },

  updateUser: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { name, email, contactNumber, ...otherData } = req.body;
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { name, email, contactNumber, ...otherData },
        include: {
          supplier: true,
        },
      });

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating user', error: error.message });
    }
  },

  approveUser: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      // Assuming 'verified' is a boolean in your database schema
      // If it's an integer or other type, adjust accordingly
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { verified: true }, // Update only the 'verified' field
        include: {
          supplier: true, // Adjust this line if needed
        },
      });

      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating user', error: error.message });
    }
  },


  // Additional user-related methods can be added here
};
