import { DataTypes } from "sequelize";
import db from "../config/database.js";


const ActivityHTTPs = db.define('activity_https', {
    uuidActivity: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        validate: {
            notEmpty: true,
        }
    },
    uuidIncidents: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
}, {
    timestamps: true, // Sequelize akan otomatis menambahkan createdAt & updatedAt
});

export default ActivityHTTPs;
