import db from "./config/database.js";
import express from "express";
import cors from "cors";
import "./models/associations.js";
import monitorRouter from "./routers/monitorRouter.js";
import userRouter from "./routers/userRouter.js";
import logsRouter from "./routers/logsRouter.js";
import { StartBackgroundLogs } from "./jobs/getLogsJobs.js";

const app = express();

(async () => {
    await db.sync({
        // force: true,
        alter: true,
    })
})();

app.use(cors({
    credentials: true,
    origin: ['http://127.0.0.1:5173', 'http://localhost:3000']
}))

app.use(express.json());
app.use(monitorRouter);
app.use(userRouter);
app.use(logsRouter);

StartBackgroundLogs();

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`[${new Date().toLocaleString()}] - Server running on port ${PORT}`);
});