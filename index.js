import db from "./config/database.js";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import "./models/associations.js";
import monitorRouter from "./routers/monitorRouter.js";
import userRouter from "./routers/userRouter.js";
import logsRouter from "./routers/logsRouter.js";
import authRouter from "./routers/authRouter.js";
import { StartBackgroundLogs } from "./jobs/getLogsJobs.js";
import session from "express-session";
import SequelizeStore from "connect-session-sequelize";

dotenv.config();

const app = express();
const sessionStore = SequelizeStore(session.Store);

const store = new sessionStore({
    db: db
});

(async () => {
    await db.sync({
        // force: true,
        alter: true,
    })
})();

app.use(session({
    secret: process.env.SESS_SECRET,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        secure: 'auto',
        maxAge: 15 * 60 * 1000, //15 Menit
    }
}));

app.use(cors({
    credentials: true,
    origin: ['http://127.0.0.1:5173', 'http://localhost:3000']
}))

app.use(express.json());
app.use(monitorRouter);
app.use(userRouter);
app.use(logsRouter);
app.use(authRouter);

StartBackgroundLogs();

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`[${new Date().toLocaleString()}] - Server running on port ${PORT}`);
});