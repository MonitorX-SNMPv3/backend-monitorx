import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const VerifyUser = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Token tidak disediakan" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Token tidak valid atau telah kadaluarsa" });
        }
        // Simpan informasi pengguna dari token ke request
        req.user = user;
        next();
    });
}; 