export const DevicesPDFTemplates = (data) => {
  return {
    content: [
      { text: 'Monitor Device Summary', style: 'header'},
      
      // Horizontal Line
      {
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0,
            lineWidth: 1,
            color: '#999999'
          },
        ],
        margin: [0, 0, 0, 10]
      },
      
      // Header Summary: Hostname, IP Address, Port, Status Check Interval, Status
      {
        columns: [
          {
            width: '35%',
            stack: [
              {
                columns: [
                  { width: '40%', text: '• Hostname', bold: true },
                  { width: '*', text: `: ${data?.hostname}` }
                ]
              },
              {
                columns: [
                  { width: '40%', text: '• IP Address', bold: true },
                  { width: '*', text: `: ${data?.ipaddress}` }
                ]
              }
            ]
          },
          {
            width: '30%',
            stack: [
              {
                columns: [
                  { width: '40%', text: '• Port', bold: true },
                  { width: '*', text: `: ${data?.snmp_port}` }
                ]
              },
              {
                columns: [
                  { width: '40%', text: '• Interval', bold: true },
                  { width: '*', text: `: ${data?.statusCheck}` }
                ]
              }
            ]
          },
          {
            width: '30%',
            stack: [
              {
                columns: [
                  { width: '40%', text: '• Status', bold: true },
                  { width: '*', text: `: ${data?.running === 'PAUSED' ? 'Paused' : data?.logs?.[0].status }`  }
                ]
              }
            ]
          }
        ],
        columnGap: 10,
        margin: [0, 0, 0, 20],
        fontSize: 11
      },

      // Lastest Logs: Subheader
      { text: 'Lastest Logs', style: 'subheader'},
      
      // Lastest Logs: Horizontal Line
      {
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0, // Lebar A4 di pdfmake biasanya sekitar 515
            lineWidth: 1,
            color: '#999999'
          }
        ],
        margin: [0, 0, 0, 10]
      },
          
      // Lastest Logs: Explanation
      { text: 'Displaying the 10 most latest logs recorded from the monitoring system.', fontSize: 11 },
          

      // Lastest Logs: Table
      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: [ 30, 50, 105, 70, 55, 55, 55 ],
          body: [
            // Header
            [
              { text: 'Status', style: 'tableHeader' },
              { text: 'Ping', style: 'tableHeader' },
              { text: 'Date', style: 'tableHeader' },
              { text: 'Uptime', style: 'tableHeader' },
              { text: 'CPU Usage', style: 'tableHeader' },
              { text: 'RAM Usage', style: 'tableHeader' },
              { text: 'Disk Usage', style: 'tableHeader' }
            ],
            
            // Data Rows (map from logs)
            ...data?.logs?.slice(-10).map(log => [
              { text: log.status || '-', fontSize: 10 },
              { text: (log.responseTime ?? '-') + 'ms', fontSize: 10 },
              { text: log.date || '-', fontSize: 10 },
              { text: log.uptime || '-', fontSize: 10 },
              { text: log.cpuUsage || '-', fontSize: 10 },
              { text: log.ramUsage || '-', fontSize: 10 },
              { text: log.diskUsage || '-', fontSize: 10 }
            ])
          ]          
        },
        layout: 'lightHorizontalLines', 
        margin: [0, 10, 0, 10]
      },
        
      // Lastest Incidents: Subheader
      { text: 'Lastest Incidents', style: 'subheader'},
      
      // Lastest Incidents: Horizontal Line
      {
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0, 
            lineWidth: 1,
            color: '#999999'
          }
        ],
        margin: [0, 0, 0, 10]
      },

      // Lastest Incidents: Explanation
      { text: 'Displaying the 10 most recent downtime incidents detected by the monitoring system.', fontSize: 11 },
          
      // Lastest Incidents: Table
      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: [40, 100, 125, 125, 65],
          body: [
            // Header
            [
              { text: 'Status', style: 'tableHeader' },
              { text: 'Root Cause', style: 'tableHeader' },
              { text: 'Started', style: 'tableHeader' },
              { text: 'Resolved', style: 'tableHeader' },
              { text: 'Duration', style: 'tableHeader' },
            ],
      
            // Body
            ...data?.incidents?.slice(-10).map(item => [
              { text: item.status || '-', fontSize: 10 },
              { text: (item.rootcause ?? '-'), fontSize: 10 },
              { text: item.started || '-', fontSize: 10 },
              { text: item.resolved || '-', fontSize: 10 },
              { text: item.duration || '-', fontSize: 10 },
            ])
          ]
        },
        layout: 'lightHorizontalLines', // bisa juga pakai 'noBorders'
        margin: [0, 10, 0, 10]
      },
    ],

    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 7]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black'
      }
    },

    defaultStyle: {
      // alignment: 'justify'
    }
  }
}

export const GlobalPDFTemplates = (data) => {
  return {
    content: [
      { text: 'Monitor Summary', style: 'header'},
      
      // Horizontal Line
      {
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0,
            lineWidth: 1,
            color: '#999999'
          },
        ],
        margin: [0, 0, 0, 10]
      },
      
      // Header Summary: Hostname, IP Address, Port, Status Check Interval, Status
      {
        columns: [
          {
            width: '35%',
            stack: [
              {
                columns: [
                  { width: '40%', text: '• Hostname', bold: true },
                  { width: '*', text: `: ${data?.hostname}` }
                ]
              },
              {
                columns: [
                  { width: '40%', text: '• IP Address', bold: true },
                  { width: '*', text: `: ${data?.ipaddress}` }
                ]
              }
            ]
          },
          {
            width: '30%',
            stack: [
              {
                columns: [
                  { width: '40%', text: '• Status', bold: true },
                  { width: '*', text: `: ${data?.running === 'PAUSED' ? 'Paused' : data?.logs?.[0].status }`  }
                ]
              },
              {
                columns: [
                  { width: '40%', text: '• Interval', bold: true },
                  { width: '*', text: `: ${data?.statusCheck}` }
                ]
              }
            ]
          },
        ],
        columnGap: 10,
        margin: [0, 0, 0, 20],
        fontSize: 11
      },

      // Lastest Logs: Subheader
      { text: 'Lastest Logs', style: 'subheader'},
      
      // Lastest Logs: Horizontal Line
      {
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0, // Lebar A4 di pdfmake biasanya sekitar 515
            lineWidth: 1,
            color: '#999999'
          }
        ],
        margin: [0, 0, 0, 10]
      },
          
      // Lastest Logs: Explanation
      { text: 'Displaying the 10 most latest logs recorded from the monitoring system.', fontSize: 11 },
          

      // Lastest Logs: Table
      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: [ 110, 110, 140, 105 ],
          body: [
            // Header
            [
              { text: 'Status', style: 'tableHeader' },
              { text: 'Ping', style: 'tableHeader' },
              { text: 'Date', style: 'tableHeader' },
              { text: 'Uptime', style: 'tableHeader' },
            ],
            
            // Data Rows (map from logs)
            ...data?.logs?.slice(-10).map(log => [
              { text: log.status || '-', fontSize: 10 },
              { text: (log.responseTime ?? '-') + 'ms', fontSize: 10 },
              { text: log.date || '-', fontSize: 10 },
              { text: log.uptime || '-', fontSize: 10 },
            ])
          ]          
        },
        layout: 'lightHorizontalLines', 
        margin: [0, 10, 0, 10]
      },
        
      // Lastest Incidents: Subheader
      { text: 'Lastest Incidents', style: 'subheader'},
      
      // Lastest Incidents: Horizontal Line
      {
        canvas: [
          {
            type: 'line',
            x1: 0, y1: 0,
            x2: 515, y2: 0, 
            lineWidth: 1,
            color: '#999999'
          }
        ],
        margin: [0, 0, 0, 10]
      },

      // Lastest Incidents: Explanation
      { text: 'Displaying the 10 most recent downtime incidents detected by the monitoring system.', fontSize: 11 },
          
      // Lastest Incidents: Table
      {
        style: 'tableExample',
        table: {
          headerRows: 1,
          widths: [40, 100, 125, 125, 65],
          body: [
            // Header
            [
              { text: 'Status', style: 'tableHeader' },
              { text: 'Root Cause', style: 'tableHeader' },
              { text: 'Started', style: 'tableHeader' },
              { text: 'Resolved', style: 'tableHeader' },
              { text: 'Duration', style: 'tableHeader' },
            ],
      
            // Body
            // Data Rows (map from logs)
            ...data?.incidents?.slice(-10).map(item => [
              { text: item.status || '-', fontSize: 10 },
              { text: (item.rootcause ?? '-'), fontSize: 10 },
              { text: item.started || '-', fontSize: 10 },
              { text: item.resolved || '-', fontSize: 10 },
              { text: item.duration || '-', fontSize: 10 },
            ])
          ]
        },
        layout: 'lightHorizontalLines', // bisa juga pakai 'noBorders'
        margin: [0, 10, 0, 10]
      },
    ],

    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 7]
      },
      subheader: {
        fontSize: 16,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'black'
      }
    },

    defaultStyle: {
      // alignment: 'justify'
    }
  }
}