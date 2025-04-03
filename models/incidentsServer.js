import { DataTypes } from "sequelize";
import db from "../config/database.js";


const IncidentsServers = db.define('incidents_servers', {
    uuidIncidents: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
        validate: {
            notEmpty: true,
        }
    },
    uuidServers: {
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
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    duration: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    timestamps: true, // Sequelize akan otomatis menambahkan createdAt & updatedAt
});

export default IncidentsServers;
