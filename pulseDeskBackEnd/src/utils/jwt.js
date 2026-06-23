import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

export const signRefreshToken = (user) =>
  jwt.sign({ id: user._id }, env.jwtSecret, {
    expiresIn: "30d"
  });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);
