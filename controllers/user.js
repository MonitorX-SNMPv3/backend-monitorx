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
            type: type, 
            name: name, 
            email: email,
            password: hashedPass, 
        });
        res.status(201).json({ msg: "User berhasil ditambahkan"})
    } catch (error) {
        res.status(400).json({ msg: error.message })
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const user = await Users.findAll({
            order: [['name', 'ASC']],
            attributes: { exclude: ['password'] }
        });

        res.status(200).json(user);
    } catch (error) {
        res.status(502).json({ msg: error.message });
    }
}

export const deleteUser = async (req, res) => {
    try {
        const { uuid } = req.body;
        console.log(uuid);
        
        const user = await Users.findOne({ where: { uuidUsers: uuid } });

        if (!user) {
            return res.status(404).json({ msg: "User not found." });
        }

        await user.destroy();
        
        res.status(200).json({ msg: "User deleted successfully." });
    } catch (error) {
        res.status(502).json({ msg: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { uuid, type, name, email, password } = req.body;

    if (!uuid) {
        return res.status(400).json({ msg: "User ID (uuid) is required!" });
    }

    try {
        const user = await Users.findOne({ where: { uuidUsers: uuid } });
        if (!user) {
            return res.status(404).json({ msg: "User not found!" });
        }

        user.type = type || user.type;
        user.name = name || user.name;
        user.email = email || user.email;

        if (password) {
            const hashedPass = await argon2.hash(password);
            user.password = hashedPass;
        }

        await user.save();

        res.status(200).json({ msg: "User successfully updated!" });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
