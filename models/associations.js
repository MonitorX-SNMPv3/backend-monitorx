import IncidentsHTTPs from "./incidentsHTTP.js";
import IncidentsNetworks from "./incidentsNetwork.js";
import IncidentsPorts from "./incidentsPort.js";
import IncidentsServers from "./incidentsServer.js";
import LogsHTTPs from "./logsHTTP.js";
import LogsNetworks from "./logsNetwork.js";
import LogsPorts from "./logsPort.js";
import LogsServers from "./logsServer.js";
import MonitorHTTPs from "./monitorHTTP.js";
import MonitorNetworks from "./monitorNetwork.js";
import MonitorPorts from "./monitorPorts.js";
import MonitorServers from "./monitorServer.js";
import Users from "./userModels.js";

//? Relasi Users */
Users.hasMany(MonitorHTTPs, {
    foreignKey: "uuidUsers",
    as: "monitor_https",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
Users.hasMany(MonitorServers, {
    foreignKey: "uuidUsers",
    as: "monitor_servers",
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
Users.hasMany(MonitorNetworks, {
    foreignKey: "uuidUsers",
    as: "monitors_networks",
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

//? Relasi Servers */
MonitorServers.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorServers.hasMany(LogsServers, {
    foreignKey: "uuidServers",
    as: "logs_servers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorServers.hasMany(IncidentsServers, {
    foreignKey: "uuidServers",
    as: "incidents_servers",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Networks */
MonitorNetworks.belongsTo(Users, {
    foreignKey: "uuidUsers",
    as: "users"
});
MonitorNetworks.hasMany(LogsNetworks, {
    foreignKey: "uuidNets",
    as: "logs_networks",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});
MonitorNetworks.hasMany(IncidentsNetworks, {
    foreignKey: "uuidNets",
    as: "incidents_networks",
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
    constraints: true,
});

//? Relasi Logs */
LogsHTTPs.belongsTo(MonitorHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "logs_https",
});
LogsNetworks.belongsTo(MonitorNetworks, {
    foreignKey: "uuidNets",
    as: "logs_networks",
});
LogsPorts.belongsTo(MonitorPorts, {
    foreignKey: "uuidPorts",
    as: "logs_ports",
});
LogsServers.belongsTo(MonitorServers, {
    foreignKey: "uuidServers",
    as: "logs_servers",
});

//? Relasi Incidents */
IncidentsHTTPs.belongsTo(MonitorHTTPs, {
    foreignKey: "uuidHTTPs",
    as: "incidents_https",
});
IncidentsNetworks.belongsTo(MonitorNetworks, {
    foreignKey: "uuidNets",
    as: "incidents_networks",
});
IncidentsPorts.belongsTo(MonitorPorts, {
    foreignKey: "uuidPorts",
    as: "incidents_ports",
});
IncidentsServers.belongsTo(MonitorServers, {
    foreignKey: "uuidServers",
    as: "incidents_servers",
});

export { Users, MonitorHTTPs, MonitorNetworks, MonitorPorts, MonitorServers };