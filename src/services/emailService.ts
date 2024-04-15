import nodemailer from "nodemailer";

export const EmailService = {
  sendEmail: async (userEmail: string, message: string, subject: string) => {
  
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
        to: userEmail,
        subject: subject,
        html: message,
      };

      // Send email
      await transporter.sendMail(mailOptions);
      console.log("mail sent");

  },
};
