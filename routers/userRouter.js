import express from "express";
import { createUsers } from "../controllers/user.js";

const router = express.Router();

router.post('/api/add_user', createUsers);

export default router;