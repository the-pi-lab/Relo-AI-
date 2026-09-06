import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  generateVerificationToken() {
    return generateRandomString(6, alphabet("0-9"));
  },
  async sendVerificationRequest(params) {
    console.log("📧 sendVerificationRequest called with params:", Object.keys(params));
    
    const { identifier: email, token } = params;
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

    // Phase 14: never log the OTP token or email address (PII/secret hygiene).
    if (!resendApiKey) {
      const err = "RESEND_API_KEY environment variable is not set";
      console.error("❌", err);
      throw new Error(err);
    }

    if (!email || !token) {
      const err = "Missing email or token for OTP request";
      console.error("❌", err);
      throw new Error(err);
    }

    try {
      console.log("🚀 Sending email via Resend API...");

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Your ChatFlow AI Verification Code</h2>
            <p style="color: #666; font-size: 16px;">Use this code to sign in to ChatFlow AI:</p>
            <div style="background-color: #f0f0f0; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0; border: 2px solid #007bff;">
              <h1 style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #333; margin: 0; font-family: 'Courier New', monospace;">${token}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 15 minutes.</p>
            <p style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              If you didn't request this code, you can safely ignore this email.
            </p>
          </div>
        </body>
        </html>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: fromEmail,
          to: email,
          subject: "Your ChatFlow AI Verification Code",
          html: emailHtml,
        }),
      });

      console.log("📬 Resend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Resend API failed:", response.status, errorText);
        throw new Error(`Resend API error (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log("✅ Email sent successfully!");
      console.log("   Email ID:", result.id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("🚨 Email sending failed:", errorMessage);
      throw new Error(`Failed to send verification email: ${errorMessage}`);
    }
  },
});