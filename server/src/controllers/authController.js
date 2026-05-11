import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/jwt.js";
import User from "../models/User.js";

const authResponse = (user, statusCode, res) => {
  const token = signToken(user);
  res.status(statusCode).json({ success: true, token, user: user.toSafeObject() });
};

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role = "customer" } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw new ApiError(409, "Email is already registered");

  const safeRole = req.user?.role === "admin" ? role : "customer";
  const user = await User.create({ name, email, password, role: safeRole });
  authResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }
  user.lastSeenAt = new Date();
  await user.save({ validateBeforeSave: false });
  authResponse(user, 200, res);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, users });
});
