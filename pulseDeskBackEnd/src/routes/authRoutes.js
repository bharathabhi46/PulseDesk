import express from "express";
import {
  createStaff,
  forgotPassword,
  listUsers,
  login,
  me,
  refresh,
  resetPassword,
  signup,
  updateUser
} from "../controllers/authController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, me);

// Team & User Management
router.get("/users", protect, authorize("superadmin", "admin", "manager", "agent"), listUsers);
router.post("/users", protect, authorize("superadmin", "admin"), createStaff);
router.patch("/users/:id", protect, authorize("superadmin", "admin"), updateUser);

export default router;
