import ActivityHTTPs from "../models/activityHTTP.js";
import ActivityPort from "../models/activityPort.js";
import ActivityServer from "../models/activityServer.js";
import IncidentsHTTPs from "../models/incidentsHTTP.js";
import IncidentsPorts from "../models/incidentsPort.js";
import IncidentsServers from "../models/incidentsServer.js";
import MonitorHTTPs from "../models/monitorHTTP.js";
import MonitorPorts from "../models/monitorPorts.js";
import MonitorServers from "../models/monitorServer.js";
import { Op } from 'sequelize';

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
        model: IncidentsServers,
        uuidKey: 'uuidServers',
        type: 'server',
        monitorModel: MonitorServers,
        activityModel: ActivityServer,
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
        model: IncidentsServers,
        uuidKey: 'uuidServers',
        type: 'server',
        monitorModel: MonitorServers,
        activityModel: ActivityServer,
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

    let count24Total = 0; 
    let count72Total = 0;  
    let count128Total = 0;   

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

      count24Total += count24;
      count72Total += count72;
      count128Total += count128;
    }


    res.status(200).json({
      "h24": count24Total,
      "h72": count72Total,
      "h128": count128Total,
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
              model: IncidentsServers,
              uuidKey: 'uuidServers',
              type: 'server',
              monitorModel: MonitorServers,
              activityModel: ActivityServer,
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
