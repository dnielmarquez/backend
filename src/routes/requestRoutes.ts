import express from "express";
import { RequestController, upload } from "../controllers/requestController";
import { roleMiddleware } from "../middlewares/roleMiddleware";
import multer from "multer";
const router = express.Router();
// Configuración básica de Multer
const storageInMemory = multer.memoryStorage(); // Almacena el archivo en la memoria
const uploadInMemory = multer({ storage: storageInMemory });
// Middleware to restrict access to admins only
const supplierOnly = roleMiddleware(["SUPPLIER"]);
// Route to get all requests
router.get("/", RequestController.getAllRequests);

// Route to get a request by ID
router.get("/:id", RequestController.getRequestById);

// Route to create a new request
router.post("/", RequestController.createRequest);

// Route to update a request
router.put("/:id", RequestController.updateRequest);

// Route to upload to blockchain
router.put(
  "/uploadBlockchain/:id",
  uploadInMemory.single("file"),
  RequestController.uploadToBlockchain
);

// Route to verify a request
router.put("/verify/:id", RequestController.verifyRequest);

// Route to delete a request
router.delete("/:id", RequestController.deleteRequest);

// Route to get requests by company ID
router.get("/byCompany/:companyId", RequestController.getRequestsByCompany);

// Route to get requests by company ID
router.get(
  "/bySupplierEmployee/:userId",
  supplierOnly,
  RequestController.getRequestBySupplier
);

// Allow up to 10 images
router.post(
  "/uploadImages",
  upload.array("images", 30),
  RequestController.uploadImages
);

export default router;
