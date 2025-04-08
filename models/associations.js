import ActivityHTTPs from "./activityHTTP.js";
import ActivityPort from "./activityPort.js";
import ActivityDevices from "./activityDevices.js";
import IncidentsHTTPs from "./incidentsHTTP.js";
import IncidentsPorts from "./incidentsPort.js";
import IncidentsDevices from "./incidentsDevices.js";
import LogsHTTPs from "./logsHTTP.js";
import LogsPorts from "./logsPort.js";
import LogsDevices from "./logsDevices.js";
import MonitorHTTPs from "./monitorHTTP.js";
import MonitorPorts from "./monitorPorts.js";
import MonitorDevices from "./monitorDevices.js";
import Users from "./userModels.js";

//? Relasi Users */
Users.hasMany(MonitorHTTPs, {
    foreignKey: "uuidUsers",
    as: "monitor_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
Users.hasMany(MonitorDevices, {
    foreignKey: "uuidUsers",
    as: "monitor_devices",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
Users.hasMany(MonitorPorts, {
    foreignKey: "uuidUsers",
    as: "monitor_ports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});


//? Relasi HTTPs */
MonitorHTTPs.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorHTTPs.hasMany(LogsHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "logs_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorHTTPs.hasMany(IncidentsHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "incidents_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Ports */
MonitorPorts.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorPorts.hasMany(LogsPorts, {
    foreignKey: "uuidPorts",
    as: "logs_ports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorPorts.hasMany(IncidentsPorts, {
    foreignKey: "uuidPorts",
    as: "incidents_ports",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Devices */
MonitorDevices.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorDevices.hasMany(LogsDevices, {
    foreignKey: "uuidDevices",
    as: "logs_devices",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorDevices.hasMany(IncidentsDevices, {
    foreignKey: "uuidDevices",
    as: "incidents_devices",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Logs */
LogsHTTPs.belongsTo(MonitorHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "logs_https",
});
LogsPorts.belongsTo(MonitorPorts, {
    foreignKey: "uuidPorts",
    as: "logs_ports",
});
LogsDevices.belongsTo(MonitorDevices, {
    foreignKey: "uuidDevices",
    as: "logs_devices",
});

//? Relasi Incidents */
IncidentsHTTPs.belongsTo(MonitorHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "incidents_https",
});
IncidentsHTTPs.hasMany(ActivityHTTPs, {
    foreignKey: "uuidIncidents",
    as: "activity_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});


IncidentsPorts.belongsTo(MonitorPorts, {
    foreignKey: "uuidPorts",
    as: "incidents_ports",
});
IncidentsPorts.hasMany(ActivityPort, {
    foreignKey: "uuidIncidents",
    as: "activity_port",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});


IncidentsDevices.belongsTo(MonitorDevices, {
    foreignKey: "uuidDevices",
    as: "incidents_devices",
});
IncidentsDevices.hasMany(ActivityDevices, {
    foreignKey: "uuidIncidents",
    as: "activity_devices",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

ActivityDevices.belongsTo(IncidentsDevices, {
    foreignKey: "uuidIncidents",
    as: "incidents_devices",
});
ActivityPort.belongsTo(IncidentsPorts, {
    foreignKey: "uuidIncidents",
    as: "incidents_ports",
});
ActivityHTTPs.belongsTo(IncidentsHTTPs, {
    foreignKey: "uuidIncidents",
    as: "incidents_https",
});

export { 
    Users, 
    MonitorHTTPs, 
    MonitorPorts, 
    MonitorDevices, 
    LogsHTTPs, 
    LogsPorts, 
    LogsDevices, 
    IncidentsHTTPs, 
    IncidentsPorts, 
    IncidentsDevices, 
    ActivityHTTPs, 
    ActivityPort, 
    ActivityDevices
};