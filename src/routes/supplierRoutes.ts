import express from 'express';
import { SupplierController } from '../controllers/supplierController';

const router = express.Router();

// Route to get all suppliers
router.get('/', SupplierController.getAllSuppliers);



export default router;
