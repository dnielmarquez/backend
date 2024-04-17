import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AuthService } from "../services/authService";
const prisma = new PrismaClient();
import multer from "multer";
import path from "path";
import {
  determineOverallStatus,
  validateCoating,
  validateMachining,
} from "../utils/validationUtils";
import { Web3Service } from "../services/web3Service";
import { EmailService } from "../services/emailService";

// Set up Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // You need to create this folder or set a folder you prefer
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});

export const upload = multer({ storage: storage });

export const RequestController = {
  // Add this function in your RequestController
  uploadImages: async (req: Request, res: Response) => {
    try {
      console.log("upload1");
      const files = req.files as Express.Multer.File[];
      console.log("upload2");
      if (!files || files.length === 0) {
        console.log("upload3");
        return res.status(400).json({ message: "No files uploaded." });
      }
      console.log("upload4");
      // Here you can implement logic to store URLs in your database
      // For simplicity, we are just returning the file paths
      const fileUrls = files.map((file) => `/uploads/${file.filename}`);
      console.log("upload5");
      res.json({ message: "Files uploaded successfully.", urls: fileUrls });
    } catch (error: any) {
      console.log("upload6");
      res
        .status(500)
        .json({ message: "Error uploading files", error: error.message });
    }
  },
  getRequestsByCompany: async (req: Request, res: Response) => {
    try {
      const companyId = req.params.companyId; // Extracting company ID from request parameters

      // Validate if the company ID corresponds to an existing user
      const company = await prisma.user.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Assuming a company is identified by having a specific role, like COMPANY_PIC
      if (company.role !== "COMPANY_PIC") {
        return res.status(400).json({ message: "Invalid company ID" });
      }

      // Fetching requests created by the company
      const requests = await prisma.request.findMany({
        where: { createdByUserId: companyId },
        include: { assignedSuppliers: true }, // Include assigned suppliers
      });

      res.json(requests);
    } catch (error: any) {
      res.status(500).json({
        message: "Error fetching requests for the company",
        error: error.message,
      });
    }
  },
  getAllRequests: async (req: Request, res: Response) => {
    try {
      const requests = await prisma.request.findMany({
        include: { assignedSuppliers: true }, // Include assigned suppliers
      });
      res.json(requests);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching requests", error: error.message });
    }
  },

  getRequestById: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const request = await prisma.request.findUnique({
        where: { id },
        include: { assignedSuppliers: true }, // Include assigned suppliers
      });
      if (request) {
        res.json(request);
      } else {
        res.status(404).json({ message: "Request not found" });
      }
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error fetching request", error: error.message });
    }
  },

  getRequestBySupplier: async (req: Request, res: Response) => {
    try {
      // Extract the JWT token from the Authorization header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
      const decoded = AuthService.verifyToken(token);
      // Verify and decode the JWT token to extract user information
      if (decoded) {
        const userId = decoded.id;
        console.log("decoded", decoded);
        // Fetch the user to get the supplierId
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        if (!user || !user.supplierId) {
          return res
            .status(404)
            .json({ message: "User or Supplier not found" });
        }

        // Fetch all requests related to the supplierId with statuses "ReadyForReview", "Replace", and "Repair"
        const requests = await prisma.supplier.findUnique({
          where: {
            id: user.supplierId,
          },
          include: {
            assignedRequests: {
              where: {
                status: {
                  in: [
                    "ReadyForReview",
                    "Replace",
                    "Repair",
                    "Accepted",
                    "AcceptAsIs",
                  ], // Specify the statuses in an array
                },
              },
            },
          },
        });

        res.json(requests);
      }
    } catch (error: any) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }
      res
        .status(500)
        .json({ message: "Error fetching requests", error: error.message });
    }
  },

  createRequest: async (req: Request, res: Response) => {
    try {
      const { assignedSupplierIds, createdByUserId, ...requestData } = req.body;
      // Validate createdByUserId

      const createdByUser = await prisma.user.findUnique({
        where: { id: createdByUserId },
      });

      if (!createdByUser || createdByUser.role != "COMPANY_PIC") {
        return res.status(400).json({ message: "Invalid createdByUserId." });
      }

      // Validate assignedSupplierIds
      const validSuppliers = await prisma.supplier.findMany({
        where: { id: { in: assignedSupplierIds } },
      });

      // Ensure all assignedSupplierIds are valid
      if (validSuppliers.length !== assignedSupplierIds.length) {
        return res
          .status(400)
          .json({ message: "One or more supplier IDs are invalid." });
      }

      const status = "ReadyForReview";
      // Create a new request with valid supplier IDs
      const newRequest = await prisma.request.create({
        data: {
          ...requestData,
          createdByUserId,
          status,
          assignedSuppliers: {
            connect: assignedSupplierIds.map((id: any) => ({ id })),
          },
        },
        include: { assignedSuppliers: true }, // Include related records
      });
      //esta linea de abajo es para enviar el correo
      const assignmentDate = new Date(requestData.assignmentDate);
      const dueDate = new Date(requestData.dueDate);

      const formattedAssignmentDate = assignmentDate.toLocaleDateString(
        "en-En",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );
      const formattedDueDate = dueDate.toLocaleDateString("en-En", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (validSuppliers.length > 0) {
        for (const supplier of validSuppliers) {
          const assignedEmployees = await prisma.user.findMany({
            where: { supplierId: supplier.id },
          });
          for (const employee of assignedEmployees) {
            console.log("employee email", employee.email);
            try {
              await EmailService.sendEmail(
                employee.email,
                `
                <p>Hey!, you just received a new order request.</p>
                <p>Assignment Date: ${formattedAssignmentDate} - Due Date: ${formattedDueDate}.</p>
                <p>Please check the order in: <a href="https://mputmblkchain.online/supplier/supplier-checklist/${newRequest.id}">here</a>.</p>
              `,
                "New Order Request For You!"
              );
            } catch (error) {
              console.log(error);
              throw new Error("error");
            }
          }
        }
      }
      console.log("nuevo request");
      //esta linea de arriba es para enviar el correo
      res.status(201).json(newRequest);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating request", error: error.message });
    }
  },
  verifyRequest: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      // Extract the JWT token from the Authorization header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }
      const decoded = AuthService.verifyToken(token);
      const updatedRequest = await prisma.request.update({
        where: { id },
        data: {
          dateChecked: new Date().toISOString(),
          supplierThatChecked: decoded.id,
          ...req.body,
        },
      });
      console.log("item", updatedRequest);
      if (!updatedRequest.productRequirements)
        return res
          .status(400)
          .json({ message: "Product requirements are missing" });
      let productReq = JSON.parse(updatedRequest.productRequirements as string);
      let machiningData;
      let coatingData;
      let machiningValidation;
      let coatingValidation;
      let dataToSend: any = {};
      if (updatedRequest.reviewedMachining) {
        machiningData = updatedRequest.reviewedMachining as any[];
        machiningValidation = validateMachining(machiningData, productReq);
        dataToSend.reviewedMachining = machiningValidation;
      }
      if (updatedRequest.reviewedCoating) {
        coatingData = updatedRequest.reviewedCoating as any[];
        coatingValidation = validateCoating(coatingData, productReq);
        dataToSend.reviewedCoating = coatingValidation;
      }
      // Determine the overall status based on validations
      const overallStatus = determineOverallStatus(
        machiningValidation,
        coatingValidation
      );

      const allMachiningPassed =
        !machiningValidation ||
        machiningValidation.every((item) => item.validationStatus);

      dataToSend.machiningPassed = allMachiningPassed;

      // Check if all coating validations passed or if it's not applicable
      const allCoatingPassed =
        !coatingValidation ||
        coatingValidation.every((batch) =>
          batch.samples.every(
            (sample: { validationStatus: any }) => sample.validationStatus
          )
        );

      dataToSend.coatingPassed = allCoatingPassed;

      dataToSend.systemReview = JSON.stringify({
        machiningValidation,
        coatingValidation,
      });
      dataToSend.status = overallStatus;
      const request = await prisma.request.findUnique({
        where: { id: id },
      });
      if (request) {
        const company = await prisma.user.findUnique({
          where: { id: request.createdByUserId },
        });
        if (dataToSend.status == "Rejected" && company) {
          EmailService.sendEmail(
            company.email,
            `
      <p>Oops, your order review was rejected, please enter the app and check.</p>
      <p>Check order in <a href="https://mputmblkchain.online/company/requestSummary/${id}">here</a>.</p>
    `,
            "New Order Rejected"
          );
        }
        if (
          (dataToSend.status == "Accepted" ||
            dataToSend.status == "AcceptAsIs") &&
          company
        ) {
          dataToSend.acceptedBy = company?.companyName;
          dataToSend.acceptedByPosition = company?.position;
          dataToSend.dateAccepted = new Date().toISOString();
        }
      }

      const finalUpdate = await prisma.request.update({
        where: { id },
        data: dataToSend,
      });
      res.json(finalUpdate);
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error updating request", error: error.message });
    }
  },
  updateRequest: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const { assignedSupplierIds, ...updateData } = req.body;

      // Prepare the update payload
      let updatePayload = { ...updateData };

      // If assignedSupplierIds are provided, update them
      if (assignedSupplierIds) {
        updatePayload = {
          ...updatePayload,
          assignedSuppliers: {
            set: [], // Clear current connections
            connect: assignedSupplierIds.map((id: any) => ({ id })),
          },
        };
      }
      if (
        updateData.status &&
        (updateData.status == "AcceptAsIs" || updateData.status == "Accepted")
      ) {
        try {
          const token = req.headers.authorization?.split(" ")[1];
          if (!token) {
            return res.status(401).json({ message: "No token provided" });
          }
          const decoded = AuthService.verifyToken(token);
          const company = await prisma.user.findUnique({
            where: { id: decoded.id },
          });
          updatePayload.acceptedBy = company?.companyName;
          updatePayload.acceptedByPosition = company?.position;
          updatePayload.dateAccepted = new Date().toISOString();
        } catch (error: any) {
          res
            .status(500)
            .json({ message: "Error updating request", error: error.message });
        }
      }
      if (
        updateData.status &&
        (updateData.status == "Repair" || updateData.status == "Replace")
      ) {
        const requestLoaded = await prisma.request.findUnique({
          where: { id },
        });
        if (requestLoaded) {
          if (requestLoaded.status == "Rejected") {
            if (!requestLoaded.machiningPassed) {
              updatePayload.prevReviewedMachining =
                requestLoaded.reviewedMachining;
              updatePayload.reviewedMachining = "";
            }
            if (!requestLoaded.coatingPassed) {
              updatePayload.prevReviewedCoating = requestLoaded.reviewedCoating;
              updatePayload.reviewedCoating = "";
            }
          }
          if (requestLoaded.supplierThatChecked) {
            const userSup = await prisma.user.findUnique({
              where: { id: requestLoaded.supplierThatChecked },
            });
            if (userSup) {
              const dueDate = new Date(updatePayload.dueDate);
              const formattedDueDate = dueDate.toLocaleDateString("en-En", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              EmailService.sendEmail(
                userSup.email,
                `
                  <p>Attention!, your order has a new Due Date, please enter the app and check.</p>
                  <p>New Due Date: ${formattedDueDate}.</p>
                  <p>Check order in <a href="https://mputmblkchain.online/supplier/supplier-checklist/${id}">here</a>.</p>
                `,
                "New Due Date for order"
              );
            }
          }
        }
      }

      const updatedRequest = await prisma.request.update({
        where: { id },
        data: updatePayload,
        include: { assignedSuppliers: true }, // Include related records
      });

      res.json(updatedRequest);
    } catch (error: any) {
      console.log(error);
      res
        .status(500)
        .json({ message: "Error updating request", error: error.message });
    }
  },
  uploadToBlockchain: async (req: Request, res: Response) => {
    console.log(req.file);
    if (!req.file) {
      return res.status(400).send("No file was provided");
    }

    try {
      const receipt = await Web3Service.uploadFileToBlockchain(req, res);

      if (receipt && receipt.txHash) {
        // Actualiza el registro en la base de datos con el hash de la transacción y marca el archivo como subido
        const updatedRequest = await prisma.request.update({
          where: {
            // Aquí necesitas una forma de identificar la solicitud específica, posiblemente a través de un ID enviado en el request
            id: req.params.id,
          },
          data: {
            fileOnchainHash: receipt.ipfsHash,
            blockchainTx: receipt.txHash, // Asumiendo que se usa el mismo hash para ambos campos
          },
        });

        return res.status(200).json(updatedRequest);
      } else {
        return res.status(400).send("Failed to upload file to blockchain");
      }
    } catch (error) {
      console.error("Error uploading file to blockchain:", error);
      return res.status(500).send("Server error");
    }
  },
  deleteRequest: async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      await prisma.request.delete({ where: { id } });
      res.json({ message: "Request successfully deleted" });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error deleting request", error: error.message });
    }
  },

  // Additional methods related to requests can be added here
};
