import db from "./config/database.js";
import express from "express";
import cors from "cors";
import "./models/associations.js";
import monitorRouter from "./routers/monitorRouter.js";
import userRouter from "./routers/userRouter.js";
import logsRouter from "./routers/logsRouter.js";
import authRouter from "./routers/authRouter.js";
import incidentRouter from "./routers/incidentRouter.js";
import { StartBackgroundLogs } from "./jobs/LogsJobs.js";
import session from "express-session";
import SequelizeStore from "connect-session-sequelize";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

(async () => {
    await db.sync({
        // force: true,
        alter: true,
    })
})();

app.use(cors({
    credentials: true,
    origin: ['http://localhost:3000']
}))


app.use(cookieParser());
app.use(express.json());
app.use(monitorRouter);
app.use(incidentRouter);
app.use(userRouter);
app.use(logsRouter);
app.use(authRouter);

StartBackgroundLogs();

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`[${new Date().toLocaleString()}] - Server running on port ${PORT}`);
});