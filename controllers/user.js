import argon2 from "argon2";
import Users from "../models/userModels.js";

export const createUsers = async (req, res) => {
    const { type, name, email, password, confirmPass } = req.body;

    if ( !type || !name || !email || !password || !confirmPass ) {
        return res.status(400).json({ msg: "Data ada yang kosong!" });
    }

    if ( !password || !confirmPass ) {
        return res.status(400).json({ msg: "Password dan confirm password tidak cocok!" })
    }

    let hashedPass = await argon2.hash(password);

    try {        
        await Users.create({ 
            type, 
            name, 
            email,
            hashedPass, 
        });
        res.status(201).json({ msg: "User berhasil ditambahkan"})
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};

