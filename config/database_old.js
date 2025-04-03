// import mysql from "mysql2/promise";
// import { Sequelize } from "sequelize";

// const databaseName = "monitorx_db";

// // Buat koneksi sementara ke MySQL tanpa memilih database
// const connection = await mysql.createConnection({ 
//     host: "localhost", 
//     user: "root", 
//     password: "" 
// });

// // Buat database jika belum ada
// await connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`);

// const db = new Sequelize(databaseName, "root", "", {
//     host: "localhost",
//     dialect: "mysql",
//     timezone: "+07:00",
//     logging: false,
//     dialectOptions: {
//         dateStrings: true,
//     }
// });

// export default db;
