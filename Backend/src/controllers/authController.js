const authService = require("../services/authService");
const { sendError } = require("../utils/errorResponse");

const generateInvite = async (req, res) => {
  try {
    const { role, email } = req.body;
    const origin =
      req.get("referer") || req.get("origin") || "http://localhost:5173";
    const frontendUrl = origin.endsWith("/") ? origin.slice(0, -1) : origin;

    const result = await authService.generateInviteLink(
      role,
      email,
      frontendUrl,
    );
    return res.status(201).json({
      message: "Invitation generated and email sent successfully",
      ...result,
    });
  } catch (error) {
    return sendError(res, error, 400, "Unable to generate invitation");
  }
};

const getInvitations = async (req, res) => {
  try {
    const Invitation = require("../models/Invitation");
    const invitations = await Invitation.find().sort({ createdAt: -1 });
    return res.status(200).json({
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    return sendError(res, error, 500, "Unable to load invitations");
  }
};

const axios = require("axios");

const googleAuth = async (req, res) => {
  try {
    const { idToken, inviteToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: "Google ID Token is required" });
    }

    // Verify token with Google's tokeninfo API
    let payload;
    try {
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );
      payload = response.data;

      // Verify audience matches our Client ID
      if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
        return res
          .status(400)
          .json({
            message: "Google ID token validation failed: Audience mismatch",
          });
      }
    } catch (err) {
      console.error("Google Token Validation Error:", err.message);
      return res
        .status(400)
        .json({ message: "Invalid or expired Google ID token" });
    }

    const userData = {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      profilePicture: payload.picture || "",
      inviteToken,
    };

    // processUserRegistration returns user and token
    const { user, authToken } =
      await authService.processUserRegistration(userData);

    return res.status(200).json({
      message: "Authentication successful",
      token: authToken,
      user,
    });
  } catch (error) {
    console.error("Google Auth Controller Error:", error.message);
    return sendError(res, error, 400, "Authentication failed");
  }
};

const generateBulkInvites = async (req, res) => {
  try {
    const { invitations } = req.body;
    const origin =
      req.get("referer") || req.get("origin") || "http://localhost:5173";
    const frontendUrl = origin.endsWith("/") ? origin.slice(0, -1) : origin;

    const result = await authService.generateBulkInvites(
      invitations,
      frontendUrl,
    );
    return res.status(201).json({
      message: "Bulk invitations processed",
      ...result,
    });
  } catch (error) {
    return sendError(res, error, 400, "Unable to generate invitations");
  }
};

module.exports = {
  generateInvite,
  generateBulkInvites,
  getInvitations,
  googleAuth,
};
