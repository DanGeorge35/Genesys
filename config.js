/* eslint-disable no-console */
const mysql = require("mysql");
require("dotenv").config();

let options = "";

options = {
  host: "localhost",
  port: process.env.DBPORT,
  user: "root",
  password: process.env.DBPASS,
  database: process.env.DB,
};

const connection = mysql.createConnection(options); // SET DATABASE CONNECTION
connection.connect((err) => {
  if (err) throw err;
  console.log("DB Connected Successfully");
}); // CONNECT TO DATABASE AND SHOW ERROR IF ERROR

module.exports = { connection };
