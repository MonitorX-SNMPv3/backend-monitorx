import express from "express";
import { Me, SignIn, SignOut } from "../controllers/auth.js";
import { VerifyUser } from "../middleware/auth.js";

const router = express.Router();

router.post('/api/login_user', SignIn);
router.get("/api/me", VerifyUser,  Me);
router.delete("/api/logout_user", SignOut);



export default router;