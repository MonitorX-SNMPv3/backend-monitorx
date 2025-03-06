import { DataTypes } from "sequelize";
import db from "../config/database.js";

const MonitorHTTPs = db.define('monitor_https', {
    uuidHTTPs: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        validate: {
            notEmpty: true,
        }
    },
    uuidUsers: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    hostname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    ipaddress: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    statusCheck: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "5M",
    },
}, {
    timestamps: true, // Sequelize akan otomatis menambahkan createdAt & updatedAt
});

export default MonitorHTTPs;
