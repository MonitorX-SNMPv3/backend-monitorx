import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Users from "../models/userModels.js";
import ActivityDevices from "../models/activityDevices.js";
import ActivityHTTPs from "../models/activityHTTP.js";
import ActivityPort from "../models/activityPorts.js";
import { getFormattedCurrentTime } from "../utils/time.js";
import { emailTemplate } from "../utils/templates/emailTemplate.js";

export const SendEmail = async (to, subject, htmlContent) => {
    dotenv.config();

    let transporter = nodemailer.createTransport({
        host: process.env.NOTIFY_HOST, 
        port: process.env.NOTIFY_PORT,                  
        secure: false,              
        auth: {
            user: process.env.NOTIFY_EMAIL, 
            pass: process.env.NOTIFY_PASSWORD,               
        },
    });
    
    let mailOptions = {
        from: `"MonitorX" ${process.env.NOTIFY_EMAIL}`, 
        to,                                            
        subject,                                       
        html: htmlContent,
    };

    let info = await transporter.sendMail(mailOptions);
    return info;
}

export const NotifyEmailActivity = async ( attribute, attribute2, type ) => {
    const modelMap = {
        devices: ActivityDevices,
        https: ActivityHTTPs,
        ports: ActivityPort,
    };

    try {
        const user = await Users.findOne({ where: { uuidUsers: attribute.uuidUsers }});
        const subject = `Monitor ${attribute.hostname} DOWN!`;

        const info = {
            name: user.name,
            hostname: attribute.hostname,
            ipaddress: attribute.ipaddress,
            rootcause: "Connection Timeout",
            date: getFormattedCurrentTime(),
        }

        const mailsend = await SendEmail(user.email, subject, emailTemplate(info));

        const Model = modelMap[type];
        if (Model) {
            await Model.create({
                uuidIncidents: attribute2.uuidIncidents,
                description: `Successfully Notifying ${user.email}`,
            });
        }

        console.log(`[${new Date().toLocaleString()}] - Email Successfully Send`);
    } catch (error) {
        console.log(error.message);
    }
}