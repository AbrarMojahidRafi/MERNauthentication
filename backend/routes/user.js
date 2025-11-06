import { Router } from "express";

const router = Router();

import { registerUser } from "../controllers/user-controller";

// router.route("/").get(userControllers.home)
router.route("/register").post(registerUser);

export default router;
