import Users from "../models/userModels.js";
import argon2 from "argon2";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

export const SignIn = async (req, res) => {
    dotenv.config();
    try {
        const { email, password, rememberMe } = req.body;
        console.log(process.env.JWT_SECRET);
        
        const user = await Users.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Email belum terdaftar!" });
        }
    
        const validPassword = await argon2.verify(user.password, password);

        if (!validPassword) {
            return res.status(401).json({ error: "Kata sandi Salah!" });
        }
    
        const payload = {
            uuidUsers: user.uuidUsers,
            email: user.email,
            name: user.name,
            type: user.type,
        };
    
        const expiresIn = rememberMe ? "7d" : "24h";
    
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    
        res.cookie("token", token, {
            secure: "production",
            sameSite: "none", 
            httpOnly: true,
            maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000, // in milliseconds
        });
    
        res.json({ token, user: payload });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal devices error" });
    }
};

export const Me = async (req, res) => {
    try {
        res.status(200).json({ user: req.user });
    } catch (error) {
        console.error("Error pada endpoint /me:", error);
        res.status(500).json({ error: "Internal devices error" });
    }
};


export const SignOut = async (req, res) => {
    try {
        res.clearCookie("token", {
            secure: "production",
            sameSite: "none",
            httpOnly: true,
        });
        res.status(200).json({ msg: "Logout Success!"});
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ error: "Internal devices error" });
    }

}