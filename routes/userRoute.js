import express from "express";
import {
  registerController,
  loginController,
  forgotPasswordController,
  updateProfileController,
} from "../controller/authcontroller.js";
import { isAdmin, requireSignIn } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/register", registerController);

router.post("/login", loginController);

router.post("/forgot-password", forgotPasswordController);

router.put("/profile", requireSignIn, updateProfileController);

router.put(requireSignIn, isAdmin);

export default router;
