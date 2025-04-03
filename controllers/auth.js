import Users from "../models/userModels.js";
import argon2 from "argon2";

export const SignIn = async (req, res) => {
    const user = await Users.findOne({
        where: {
            email: req.body.email
        }
    });

    if (!user) {
        return res.status(404).json({ msg: "User tidak ditemukan!" })
    }

    const match = await argon2.verify(user.password, req.body.password);
    if (!match) {
        return res.status(400).json({ msg: "Password Salah!" })
    }
    
    req.session.userID = user.uuidUsers;
    const uuid = user.uuidUsers;
    const name = user.name;
    const email = user.email;

    console.log(req.session);
    

    res.status(200).json({ uuid, name, email });
}

export const Me = async (req, res) => {
    console.log("Incoming Session ID:", req.sessionID); // Debug session
    console.log("Session Data:", req.session);

    if (!req.session.userID) { return res.status(401).json({ msg: "Harap login terlebih dahulu!" }) }

    const user = await Users.findOne({
        attributes: ["uuidUsers", "name", "email"],
        where: {
            uuidUsers: req.session.userID
        }
    });

    if (!user) {
        return res.status(404).json({ msg: "User tidak ditemukan!" })
    }
    res.status(200).json(user)
}

export const SignOut = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(400).json({ msg: "Tidak dapat Logout!" })
        }
        res.status(200).json({ msg: "Anda telah Logout!" })
    })
}