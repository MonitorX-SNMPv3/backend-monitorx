import { DataTypes } from "sequelize";
import db from "../config/database.js";

const LogsHTTPs = db.define('logs_https', {
    uuidLogsHTTPs: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: true,
        primaryKey: true,
        validate: {
            notEmpty: true
        }
    },
    uuidHTTPs: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
    responseTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    statusCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: true,
        }
    },
    uptime: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "N/A",
    },

}, {
    timestamps: true,
})

export default LogsHTTPs;