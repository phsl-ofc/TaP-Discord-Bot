const mysql = require("mysql2");

const sql = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_ADDRESS,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "Discord_Bot",
});

module.exports = sql;
