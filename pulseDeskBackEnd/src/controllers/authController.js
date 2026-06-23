import crypto from "crypto";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { sendMail } from "../services/mailService.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signRefreshToken, signToken, verifyToken } from "../utils/jwt.js";

const authResponse = async (user, statusCode, res) => {
  const token = signToken(user);
  const refreshToken = signRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });

  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: user.toSafeObject()
  });
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  
  // Basic validation
  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    throw new ApiError(400, "All fields are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email is already registered");

  const safeRole = ["admin", "superadmin"].includes(req.user?.role) ? role : "customer";
  const user = await User.create({ name, email, password, role: safeRole });
  await authResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated. Please contact support.");
  }

  user.lastSeenAt = new Date();
  await user.save({ validateBeforeSave: false });
  await authResponse(user, 200, res);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users: users.map(u => u.toSafeObject()) });
});

export const refresh = asyncHandler(async (req, res) => {
  let refreshToken = req.body.refreshToken || req.query.refreshToken;
  
  if (!refreshToken && req.headers.cookie) {
    const cookies = req.headers.cookie.split(";").reduce((acc, cookie) => {
      const [key, val] = cookie.trim().split("=");
      acc[key] = val;
      return acc;
    }, {});
    refreshToken = cookies.refreshToken;
  }

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  try {
    const decoded = verifyToken(refreshToken);
    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken || !user.isActive) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const token = signToken(user);
    res.json({ success: true, token });
  } catch (error) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });
  if (!user) {
    // Return success to prevent email enumeration attacks
    return res.json({ success: true, message: "If an account exists, a reset link has been sent." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #16211f; background-color: #f7f8f3;">
      <h2 style="color: #16211f;">PulseDesk Password Reset</h2>
      <p>You requested a password reset. Please click the button below to set a new password. This link is valid for 10 minutes.</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background-color: #16211f; color: #ffffff; text-decoration: none; font-weight: bold; margin-top: 10px;">Reset Password</a>
      <p style="margin-top: 20px; font-size: 12px; color: #888;">If you did not request this email, you can safely ignore it.</p>
    </div>
  `;

  try {
    await sendMail({
      to: user.email,
      subject: "PulseDesk Password Reset Request",
      html
    });
    res.json({ success: true, message: "Password reset link sent to email." });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Error sending email. Try again later.");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    throw new ApiError(400, "Token and new password are required");
  }
  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new ApiError(400, "Password reset token is invalid or has expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  await authResponse(user, 200, res);
});

// Admin User Management
export const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name?.trim() || !email?.trim() || !password?.trim() || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }

  if (!["admin", "superadmin", "manager", "agent"].includes(role)) {
    throw new ApiError(400, "Invalid staff role specified");
  }

  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email is already registered");

  const user = await User.create({
    name,
    email,
    password,
    role,
    department,
    isActive: true
  });

  res.status(201).json({ success: true, user: user.toSafeObject() });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, role, isActive, department, password } = req.body;

  const user = await User.findById(id);
  if (!user) throw new ApiError(404, "User not found");

  // Prevent modifying the last superadmin/admin if there's only one
  if (user.role === "superadmin" && role && role !== "superadmin") {
    const superadminCount = await User.countDocuments({ role: "superadmin", isActive: true });
    if (superadminCount <= 1) {
      throw new ApiError(400, "Cannot change the role of the only active Super Admin");
    }
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  if (department !== undefined) user.department = department;
  if (password) {
    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }
    user.password = password;
  }

  await user.save();
  res.json({ success: true, user: user.toSafeObject() });
});
