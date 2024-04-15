import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { PrismaClient, User, UserRole } from "@prisma/client";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export const AuthController = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, role, ...otherData } = req.body;
      let supplier;
      if (otherData.supplierName) {
        // Check if a supplier with the provided supplierName already exists
        supplier = await prisma.supplier.findUnique({
          where: { supplierName: otherData.supplierName },
        });

        // If the supplier does not exist, create a new one
        if (!supplier) {
          supplier = await prisma.supplier.create({
            data: {
              supplierName: otherData.supplierName,
            },
          });
        }
      }

      if (!Object.values(UserRole).includes(role)) {
        throw new Error("Invalid user role");
      }
      const hashedPassword = await AuthService.hashPassword(password);

      let data = {
        email,
        password: hashedPassword,
        role,
        ...otherData,
      };
      if (supplier) {
        data.supplierId = supplier.id;
      }

      const newUser = await prisma.user.create({
        data: data,
      });

      res
        .status(201)
        .json({
          userId: newUser.id,
          role,
          token: AuthService.generateToken(newUser.id, role),
          success: true,
          message: "Registration successful.",
        });
    } catch (error: any) {
      res
        .status(400)
        .json({
          message: "Registration failed",
          error: error.message,
          success: false,
        });
    }
  },
  checkAuth: async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      // Verify the token
      jwt.verify(
        token,
        process.env.JWT_SECRET_KEY || "",
        async (err: any, decodedToken: any) => {
          if (err) {
            // Token is invalid or expired
            res
              .status(401)
              .json({
                message: "Unauthorized: Invalid token",
                isAuthenticated: false,
                success: true,
              });
          } else {
            // Token is valid, fetch user from database
            const user = await prisma.user.findUnique({
              where: { id: decodedToken.id },
            });

            if (!user) {
              res
                .status(404)
                .json({
                  message: "User not found",
                  isAuthenticated: false,
                  success: false,
                });
            } else {
              // Return user details including verification status
              res.status(200).json({
                isAuthenticated: true,
                userId: user.id,
                role: user.role,
                isVerified: user.verified, // Include the verified status
                success: true,
              });
            }
          }
        }
      );
    } catch (error: any) {
      res
        .status(400)
        .json({
          message: "Error verifying token",
          error: error.message,
          success: false,
        });
    }
  },
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await AuthService.getUserByEmail(email);
      if (!user) {
        return res
          .status(404)
          .json({ message: "User not found", success: false });
      }
      const isPasswordValid = await AuthService.validatePassword(
        password,
        user.password
      );
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Invalid password", success: false });
      }
      const token = AuthService.generateToken(user.id, user.role);
      res
        .status(200)
        .json({ userId: user.id, role: user.role, token, success: true });
    } catch (error: any) {
      res
        .status(400)
        .json({
          message: "Login failed",
          error: error.message,
          success: false,
        });
    }
  },
  sendResetToken: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const resetToken = await AuthService.generateResetToken(email);

      // Create a Nodemailer transporter using SMTP or any other transport mechanism
      const transporter = nodemailer.createTransport({
        service: "gmail", // Replace with your email service
        auth: {
          user: process.env.EMAIL, // Replace with your email
          pass: process.env.EMAIL_PASS, // Replace with your email password
        },
      });

      // Email options
      const mailOptions = {
        from: process.env.EMAIL, // Replace with your email
        to: email,
        subject: "Password Reset Token",
        text: `Your password reset token is: ${resetToken}`,
      };

      // Send email
      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ message: "Reset token sent to email", success: true });
    } catch (error: any) {
      res
        .status(400)
        .json({
          message: "Failed to send reset token",
          success: false,
          error: error.message,
        });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { resetToken, newPassword } = req.body;
      await AuthService.resetPassword(resetToken, newPassword);
      res
        .status(200)
        .json({ message: "Password has been reset", success: true });
    } catch (error: any) {
      res
        .status(400)
        .json({
          message: "Failed to reset password",
          success: false,
          error: error.message,
        });
    }
  },

  // Other auth related methods, like password recovery...
};
