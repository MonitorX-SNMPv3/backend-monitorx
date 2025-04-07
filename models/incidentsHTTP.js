import { DataTypes } from "sequelize";
import db from "../config/database.js";


const IncidentsHTTPs = db.define('incidents_https', {
    uuidIncidents: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        validate: {
            notEmpty: true,
        }
    },
    uuidHTTPs: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    rootcause: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    started: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    resolved: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "-"
    },
    duration: {
        type: DataTypes.STRING,
        defaultValue: "TCP",
    }
}, {
    timestamps: true, // Sequelize akan otomatis menambahkan createdAt & updatedAt
});

export default IncidentsHTTPs;
