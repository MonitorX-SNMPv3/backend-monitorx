import express from "express";
import { createUsers, deleteUser, getAllUsers, updateUser } from "../controllers/user.js";

const router = express.Router();

router.post('/api/add_user', createUsers);
router.get('/api/get_all_user', getAllUsers);
router.delete('/api/delete_user', deleteUser);
router.patch('/api/edit_user', updateUser);

export default router;