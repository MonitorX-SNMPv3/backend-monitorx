import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: 5432,
    dialect: "postgres",
    logging: false  
});

try {
    await db.authenticate();
    await db.sync({ alter: true });
    console.log("Connected to PostgreSQL");
} catch (error) {
    console.error("Unable to connect:", error);
}

export default db;
