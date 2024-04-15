import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const SupplierController = {
    getAllSuppliers: async (req: Request, res: Response) => {
        try {
            const suppliers = await prisma.supplier.findMany();

            res.json(suppliers);
        } catch (error: any) {
            res.status(500).json({ message: 'Error fetching suppliers', error: error.message });
        }
    },
    
    // You can add other methods for creating, updating, or deleting suppliers as needed.
};
