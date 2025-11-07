import { Router } from "express";

const router = Router();

import { registerUser, verifyEmail } from "../controllers/user-controller.js";

// router.route("/").get(userControllers.home)
router.route("/register").post(registerUser);
router.route("/verify/:token").post(verifyEmail);

export default router;
