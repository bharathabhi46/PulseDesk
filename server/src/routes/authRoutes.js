import express from "express";
import { listUsers, login, me, signup } from "../controllers/authController.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/users", protect, authorize("admin", "agent"), listUsers);

export default router;
