/* eslint-disable comma-dangle */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const fs = require("fs");
const { connection } = require("./config");

class dbhelper {
  static connection() {
    return connection;
  }
  static async processSQLFile(fileName) {
    // Extract SQL queries from files. Assumes no ';' in the fileNames
    const queries = fs
      .readFileSync(fileName)
      .toString()
      .replace(/(\r\n|\n|\r)/gm, " ") // remove newlines
      .replace(/\s+/g, " ") // excess white space
      .split(";") // split into all statements
      .map(Function.prototype.call, String.prototype.trim)
      .filter((el) => el.length !== 0); // remove any empty ones

    // Execute each SQL query sequentially
    queries.forEach(async (query) => {
      await this.runQuery(query);
    });
  }

  static async runQuery(sql) {
    return new Promise((resolve, _reject) => {
      try {
        connection.query(sql, (_error, results) => {
          if (results === undefined || results.length === 0) {
            resolve("");
          } else {
            const resultArray = Object.values(
              JSON.parse(JSON.stringify(results))
            ); // --- Remove RowDataPacket
            if (resultArray === undefined || resultArray.length === 0) {
              resolve("");
            } else {
              resolve(resultArray);
            }
          }
        });
      } catch (err) {
        console.error(err);
        resolve("");
      }
    });
  }
}

module.exports = dbhelper;
