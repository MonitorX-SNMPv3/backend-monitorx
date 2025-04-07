import express from "express";
import { createUsers, deleteUser, getAllUsers } from "../controllers/user.js";

const router = express.Router();

router.post('/api/add_user', createUsers);
router.get('/api/get_all_user', getAllUsers);
router.delete('/api/delete_user', deleteUser);

export default router;