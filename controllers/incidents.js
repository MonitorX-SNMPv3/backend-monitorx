import ActivityHTTPs from "../models/activityHTTP.js";
import ActivityPort from "../models/activityPorts.js";
import ActivityDevices from "../models/activityDevices.js";
import IncidentsHTTPs from "../models/incidentsHTTP.js";
import IncidentsPorts from "../models/incidentsPort.js";
import IncidentsDevices from "../models/incidentsDevices.js";
import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorPorts from "../models/monitorPorts.js";
import MonitorDevices from "../models/monitorDevices.js";
import { Op } from 'sequelize';
import { formatMillisecondsToHHMM } from "../utils/time.js";

export const GetAllIncidents = async (req, res) => {
  try {
    const incidentsType = [
      {
        model: IncidentsHTTPs,
        uuidKey: 'uuidHTTPs',
        type: 'https',
        monitorModel: MonitorHTTPs,
        activityModel: ActivityHTTPs,
      },
      {
        model: IncidentsDevices,
        uuidKey: 'uuidDevices',
        type: 'devices',
        monitorModel: MonitorDevices,
        activityModel: ActivityDevices,
      },
      {
        model: IncidentsPorts,
        uuidKey: 'uuidPorts',
        type: 'ports',
        monitorModel: MonitorPorts,
        activityModel: ActivityPort,
      },
    ];

    const incidentsFinal = [];

    for (const { model, uuidKey, type, monitorModel, activityModel } of incidentsType) {
      const incidents = await model.findAll({ order: [['createdAt', 'ASC']] });

      for (const incident of incidents) {
        const jsonIncidents = incident.toJSON();
        const uuid = jsonIncidents[uuidKey];

        // Konversi nilai ms pada started dan resolved ke format tanggal
        if (jsonIncidents.started) {
          const dateObj = new Date(Number(jsonIncidents.started));
          const gmt7Date = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
          jsonIncidents.started = gmt7Date.toUTCString().replace(' GMT', '');
        }
        if (jsonIncidents.resolved) {
          if (jsonIncidents.resolved === "-"){
            jsonIncidents.resolved = "-"
          } else {
            const dateObj = new Date(Number(jsonIncidents.resolved));
            const gmt7Date = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
            jsonIncidents.resolved = gmt7Date.toUTCString().replace(' GMT', '');
          }
        }

        const monitor = await monitorModel.findAll({
          where: { [uuidKey]: uuid },
          order: [['createdAt', 'ASC']],
        });

        const activity = await activityModel.findAll({
          where: { uuidIncidents: jsonIncidents.uuidIncidents },
          order: [['createdAt', 'ASC']]
        })

        incidentsFinal.push({
          ...jsonIncidents,
          type,
          monitor,
          activity  
        });
      }
    }

    res.status(200).json(incidentsFinal);
  } catch (error) {
    console.error(`[${new Date().toLocaleString()}] - ${error.message}`);
    res.status(502).json({ msg: error.message });
  }
};

export const GetIncidentsCount = async (req, res) => {
  try {
      const incidentsType = [
          {
              model: IncidentsHTTPs,
              uuidKey: 'uuidHTTPs',
              type: 'https',
              monitorModel: MonitorHTTPs,
              activityModel: ActivityHTTPs,
          },
          {
              model: IncidentsDevices,
              uuidKey: 'uuidDevices',
              type: 'devices',
              monitorModel: MonitorDevices,
              activityModel: ActivityDevices,
          },
          {
              model: IncidentsPorts,
              uuidKey: 'uuidPorts',
              type: 'ports',
              monitorModel: MonitorPorts,
              activityModel: ActivityPort,
          },
      ];

      const now = new Date();
      const date24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const date72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      const date128 = new Date(now.getTime() - 128 * 60 * 60 * 1000);
      const date720 = new Date(now.getTime() - 720 * 60 * 60 * 1000); // 720 hours ~ 1 month

      let count24Total = 0; // incidents in the last 24 hours
      let count72Total = 0; // incidents in the last 72 hours
      let count128Total = 0; // incidents in the last 128 hours
      let count720Total = 0; // incidents in the last 720 hours

      for (const { model } of incidentsType) {
          const count24 = await model.count({
              where: {
                  createdAt: {
                      [Op.gte]: date24
                  }
              }
          });

          const count72 = await model.count({
              where: {
                  createdAt: {
                      [Op.gte]: date72
                  }
              }
          });

          const count128 = await model.count({
              where: {
                  createdAt: {
                      [Op.gte]: date128
                  }
              }
          });

          const count720 = await model.count({
              where: {
                  createdAt: {
                      [Op.gte]: date720
                  }
              }
          });

          count24Total += count24;
          count72Total += count72;
          count128Total += count128;
          count720Total += count720;
      }

      res.status(200).json({
          "h24": count24Total,
          "h72": count72Total,
          "h128": count128Total,
          "h720": count720Total,
      });
  } catch (error) {
      console.error(`[${new Date().toLocaleString()}] - GetIncidentsCount - Error:`, error.message);
      res.status(500).json({ msg: "Failed to get incidents count" });
  }
};


export const GetIncidentsByUUID = async (req, res) => {
  try {
      const { uuid, type } = req.body;
      const incidentsType = [
          {
              model: IncidentsHTTPs,
              uuidKey: 'uuidHTTPs',
              type: 'https',
              monitorModel: MonitorHTTPs,
              activityModel: ActivityHTTPs,
          },
          {
              model: IncidentsDevices,
              uuidKey: 'uuidDevices',
              type: 'devices',
              monitorModel: MonitorDevices,
              activityModel: ActivityDevices,
          },
          {
              model: IncidentsPorts,
              uuidKey: 'uuidPorts',
              type: 'ports',
              monitorModel: MonitorPorts,
              activityModel: ActivityPort,
          },
      ];

      // Cari konfigurasi incident sesuai dengan type
      const typeObj = incidentsType.find(item => item.type === type);
      if (!typeObj) {
          return res.status(400).json({ msg: "Tipe monitor tidak valid." });
      }

      const { model, uuidKey, monitorModel, activityModel } = typeObj;

      // Ambil semua incidents berdasarkan uuid dan urutkan secara ascending
      const incidents = await model.findAll({
          where: { [uuidKey]: uuid },
          order: [['createdAt', 'ASC']]
      });

      const incidentsFinal = [];

      for (const incident of incidents) {
          const jsonIncidents = incident.toJSON();

          // Konversi nilai ms pada started ke format GMT+7
          if (jsonIncidents.started) {
              const dateObj = new Date(Number(jsonIncidents.started));
              const gmt7Date = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
              jsonIncidents.started = gmt7Date.toUTCString().replace(' GMT', '');
          }

          // Konversi nilai ms pada resolved ke format GMT+7
          if (jsonIncidents.resolved) {
              if (jsonIncidents.resolved === "-") {
                  jsonIncidents.resolved = "-";
              } else {
                  const dateObj = new Date(Number(jsonIncidents.resolved));
                  const gmt7Date = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
                  jsonIncidents.resolved = gmt7Date.toUTCString().replace(' GMT', '');
              }
          }

          // Ambil monitor yang terkait dengan incident berdasarkan uuid
          const monitor = await monitorModel.findAll({
              where: { [uuidKey]: uuid },
              order: [['createdAt', 'ASC']]
          });

          // Ambil aktivitas terkait dengan incident
          const activity = await activityModel.findAll({
              where: { uuidIncidents: jsonIncidents.uuidIncidents },
              order: [['createdAt', 'ASC']]
          });

          incidentsFinal.push({
              ...jsonIncidents,
              type,
              monitor,
              activity
          });
      }

      res.status(200).json(incidentsFinal);
  } catch (error) {
      console.error(`[${new Date().toLocaleString()}] - ${error.message}`);
      res.status(502).json({ msg: error.message });
  }
};

export const CalculateMTTRSummary = async (req, res) => {
  try {
      const incidentsType = [
          { model: IncidentsHTTPs },
          { model: IncidentsDevices },
          { model: IncidentsPorts },
      ];

      const now = new Date();
      // Define time thresholds for 24h and 128h.
      // We convert the threshold timestamps to strings since our DB fields are stored as strings.
      const date24String = (now.getTime() - 24 * 60 * 60 * 1000).toString();
      const date128String = (now.getTime() - 128 * 60 * 60 * 1000).toString();

      let totalMTTR24 = 0;
      let count24 = 0;
      let totalMTTR128 = 0;
      let count128 = 0;

      for (const { model } of incidentsType) {
          // For 24h: find incidents that are resolved and whose resolved timestamp is within the last 24 hours.
          const incidents24 = await model.findAll({
              where: {
                  resolved: {
                      [Op.ne]: "-", // ignore unresolved incidents
                      [Op.gte]: date24String  
                  }
              }
          });

          // For 128h: similar query for the last 128 hours.
          const incidents128 = await model.findAll({
              where: {
                  resolved: {
                      [Op.ne]: "-",
                      [Op.gte]: date128String  
                  }
              }
          });

          incidents24.forEach(incident => {
              const started = Number(incident.started);
              const resolved = Number(incident.resolved);
              if (started && resolved && resolved > started) {
                  totalMTTR24 += (resolved - started);
                  count24++;
              }
          });

          incidents128.forEach(incident => {
              const started = Number(incident.started);
              const resolved = Number(incident.resolved);
              if (started && resolved && resolved > started) {
                  totalMTTR128 += (resolved - started);
                  count128++;
              }
          });
      }

      // Calculate the average resolution times (in milliseconds)
      const mttr24Ms = count24 ? totalMTTR24 / count24 : 0;
      const mttr128Ms = count128 ? totalMTTR128 / count128 : 0;

      res.status(200).json({
          mttr24: formatMillisecondsToHHMM(mttr24Ms),
          mttr128: formatMillisecondsToHHMM(mttr128Ms)
      });
  } catch (error) {
      console.error(`[${new Date().toLocaleString()}] - CalculateMTTR - Error:`, error.message);
      res.status(500).json({ msg: "Failed to calculate MTTR" });
  }
};