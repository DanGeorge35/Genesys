/* eslint-disable no-console */
const mysql = require("mysql");
require("dotenv").config();

let options = "";
if (process.env.NODE_ENV === "") {
  // SET DATABASE FOR LOCALHOST
  options = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: process.env.DBPASS,
    database: process.env.DB,
  };
} else {
  // SET DATABASE FOR LIVE SERVER
  options = {
    host: "localhost",
    port: 3306,
    user: "root",
    password: process.env.DBPASS,
    database: process.env.DB,
  };
}

const connection = mysql.createConnection(options); // SET DATABASE CONNECTION
connection.connect((err) => {
  if (err) throw err;
  console.log("DB Connected Successfully");
}); // CONNECT TO DATABASE AND SHOW ERROR IF ERROR

module.exports = { connection };
