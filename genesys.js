/* eslint-disable no-plusplus */
/* eslint-disable no-array-constructor */
/* eslint-disable comma-dangle */
const fs = require("fs");
const DbHelper = require("./dbhandler");
require("dotenv").config();

const GenDir = "PROJECT";
class Genesys {
  static async GetTables() {
    const tables = Array();
    const results = await DbHelper.runQuery("SHOW TABLES");
    for (let i = 0; i < results.length; i++) {
      tables.push(results[i]["Tables_in_" + process.env.DB.toLowerCase()]);
    }
    return tables;
  }

  static async GetFields(tableName) {
    const name = Array();
    const required = Array();
    const results = await DbHelper.runQuery(`DESCRIBE ${tableName}`);
    for (let i = 0; i < results.length; i++) {
      if (results[i].Field !== "id") {
        name.push(results[i].Field);
        required.push(results[i].Null);
      }
    }
    return { name, required };
  }

  static async setTableModel(tableName, fields) {
    const tbname = tableName.toLowerCase();
    const TableName = tbname.charAt(0).toUpperCase() + tbname.slice(1);
    let model = `const appFunctions = require("../helpers/app.helper");\n\nclass ${TableName} {\n`;
    for (let i = 0; i < fields.name.length; i++) {
      model += `  ${fields.name[i]};\n\n`;
    }
    model += "  constructor(body) {\n";
    for (let i = 0; i < fields.name.length; i++) {
      if ((fields.name[i] === "UpdatedAT" )|| (fields.name[i] === "updated_at")) {
        model += `    this.${fields.name[i]} = appFunctions.humanTime(new Date());\n`;
      } else if ((fields.name[i] === "CreatedAT") || (fields.name[i] === "created_at")) {
        model += `    this.${fields.name[i]} = appFunctions.humanTime(new Date());\n`;
      } else if (fields.name[i].endsWith("_id")) {
        model += `    this.${fields.name[i]} = body.${fields.name[i]};\n`;
      } else {
          model += `    this.${fields.name[i]} = appFunctions.MakeEscape(body.${fields.name[i]});\n`;
      }
    }
    model += "  }\n\n";
    model += "  model() {\n";
    model += `    const sql = \`INSERT INTO ${tableName} (`;
    for (let i = 0; i < fields.name.length; i++) {
      if (i < fields.name.length - 1) {
        model += `${fields.name[i]},`;
      } else {
        model += `${fields.name[i]}) VALUES (`;
      }
    }

    for (let i = 0; i < fields.name.length; i++) {
      if (i < fields.name.length - 1) {
        model += `"\${this.${fields.name[i]}}",`;
      } else {
        model += `"\${this.${fields.name[i]}}");`;
      }
    }

  
    model += "`;\n    const newSql = sql.replace(/\"null\"/g, \"NULL\");\n";

    model += "`    return newsql;\n";

    model += `  }\n}\n\nmodule.exports = ${TableName};\n`;

    return model;
  }

  static async setService(tableName) {
    const tbname = tableName.toLowerCase();
    const TableName = tbname.charAt(0).toUpperCase() + tbname.slice(1);
    const fileDir = `${__dirname}/${GenDir}/services/${tbname}`;

    if (!fs.existsSync(fileDir)) {
      fs.mkdir(fileDir, { recursive: true }, (err) => {
        if (err) throw err;
        /*
        .
        .
         ---------------------------------------------------------Endpoints
        */
        let wstream = fs.createWriteStream(`${fileDir}/${tbname}.endpoint.js`);
        wstream.write(
          `const ${tbname}Controller = require("./${tbname}.controller");
const appFunctions = require("../../helpers/app.helper");

const ENDPOINT_URL = "/api/${tbname}";
const ${tbname}Endpoint = [
  {
    path: \`\${ENDPOINT_URL}/\`,
    method: "get",
    handler: [${tbname}Controller.get${TableName}],
  },
  {
    path: \`\${ENDPOINT_URL}/:id/\`,
    method: "get",
    handler: ${tbname}Controller.getSingle${TableName},
  },
  {
    path: \`\${ENDPOINT_URL}/\`,
    method: "post",
    handler: [
      appFunctions.Authorization,
      ${tbname}Controller.create${TableName},
    ],
  },
  {
    path: \`\${ENDPOINT_URL}/\`,
    method: "put",
    handler: [
      appFunctions.Authorization,
      ${tbname}Controller.update${TableName},
    ],
  },
  {
    path: \`\${ENDPOINT_URL}/:id/\`,
    method: "delete",
    handler: [
      appFunctions.Authorization,
      ${tbname}Controller.delete${TableName},
    ],
  },
  {
    path: \`\${ENDPOINT_URL}/:start/:limit/\`,
    method: "get",
    handler: [${tbname}Controller.get${TableName}2],
  },
];
module.exports = ${tbname}Endpoint;
`
        );
        wstream.end();

        /*
        .
        .
         ---------------------------------------------------------Controller
        */
        wstream = fs.createWriteStream(`${fileDir}/${tbname}.controller.js`);
        wstream.write(
          `/* eslint-disable no-console */
/* eslint-disable consistent-return */

const ${tbname}Handler = require("./${tbname}.handler");
const Log = require("../../helpers/console.helper");

class ${tbname}Controller {
  static async get${TableName}(req, res, next) {
    try {
      const ${tbname} = await ${tbname}Handler.get${TableName}();
      Log.info(${tbname});
      res.status(${tbname}.code).send(${tbname});
      res.end();
    } catch (error) {
      Log.info(error);
      next(error);
    }
  }

  static async get${TableName}2(req, res, next) {
    try {
      const { start, limit } = req.params;
      const ${tbname} = await ${tbname}Handler.get${TableName}(start, limit);
      Log.info(${tbname});
      res.status(${tbname}.code).send(${tbname});
      res.end();
    } catch (error) {
      Log.info(error);
      next(error);
    }
  }

  static async getSingle${TableName}(req, res, next) {
    try {
      const { id } = req.params;
      const ${tbname} = await ${tbname}Handler.getSingle${TableName}(id);
      Log.info(${tbname});
      res.status(${tbname}.code).send(${tbname});
      res.end();
    } catch (error) {
      Log.info(error);
      next(error);
    }
  }

  static async create${TableName}(req, res, next) {
    try {
      const result = await ${tbname}Handler.create${TableName}(req.body);
      Log.info(result);
      res.status(result.code).send(result);
      res.end();
    } catch (error) {
      Log.info(error);
      next(error);
    }
  }

  static async update${TableName}(req, res, next) {
    try {
      const result = await ${tbname}Handler.update${TableName}(req.body);
      Log.info(result);
      res.status(result.code).send(result);
      res.end();
    } catch (error) {
      Log.info(error);
      next(error);
    }
  }

  static async delete${TableName}(req, res, next) {
    try {
      const { id } = req.params;
      const ${tbname} = await ${tbname}Handler.delete${TableName}(id);
      Log.info(${tbname});
      res.status(${tbname}.code).send(${tbname});
      res.end();
    } catch (error) {
      Log.info(error);
      next(error);
    }
  }
}
module.exports = ${tbname}Controller;
`
        );
        wstream.end();

        /*
        .
        .
         ---------------------------------------------------------Handler
        */
        wstream = fs.createWriteStream(`${fileDir}/${tbname}.handler.js`);
        wstream.write(`/* eslint-disable no-param-reassign */
/* eslint-disable comma-dangle */
const DbHelper = require("../../helpers/db.helper");
const ${TableName}Model = require("../../models/${tbname}.model");

const appFunctions = require("../../helpers/app.helper");

class ${TableName}Handler {
  static async get${TableName}(start = 0, limit = 100) {
    const ${tbname} = await DbHelper.findTable("${tableName}", start, limit);
    return {
      message: "Success",
      code: 200,
      data: ${tbname},
    };
  }

  static async getSingle${TableName}(id) {
    const ${tbname} = await DbHelper.find("${tableName}", id, ["id"]);
    if (${tbname} === "") {
      return { message: "${TableName}  Not Found!", code: 400 };
    }
    return {
      message: "Success",
      code: 200,
      data: ${tbname},
    };
  }

  static async delete${TableName}(id) {
    const ${tbname} = await DbHelper.Delete("${tableName}", ["id"], id);
    if (${tbname} !== "Success") {
      return { message: ${tbname}, code: 400 };
    }
    return {
      message: "Success",
      code: 200,
    };
  }

  static async create${TableName}(data) {
    // eslint-disable-next-line no-param-reassign
    const ${tbname} = new ${TableName}Model(data);
    const result = await DbHelper.execute(${tbname}.model());
    const rs = await DbHelper.find("${tbname}", result.id, ["id"]);
    result.data = rs;
    return result;
  }

  static async update${TableName}(data) {
    // eslint-disable-next-line no-param-reassign
    const ${tbname} = await DbHelper.find(
      "${tableName}",
      [data.id],
      ["id"]
    );

    if (${tbname} === "") {
      return { message: "${TableName} Record  Not found", code: 404 };
    }
    let result = "";
    Object.entries(data).forEach(async ([key, value]) => {
      if (key !== "id") {
        if (DbHelper.columnExist(key)) {
          result += await DbHelper.update(
            "${tableName}",
            key,
            value,
            ["id"],
            data.id
          );
        }

        if (DbHelper.columnExist("UpdatedAT")) {
          result += await DbHelper.update(
            "${tableName}",
            "UpdatedAT",
            appFunctions.humanTime(new Date()),
            ["id"],
            data.id
          );
        }
      }
    });

    return {
      message: "Successfully Updated!",
      code: 200,
      data: result,
    };
  }
}

module.exports = ${TableName}Handler;
`);
      });
    }
  }

  static async createModel(tableName = "") {
    const fileDir = `${__dirname}/${GenDir}/models`;
    if (tableName === "") {
      const tables = await this.GetTables();
      for (let i = 0; i < tables.length; i++) {
        const fields = await this.GetFields(tables[i]);
        const result = await this.setTableModel(tables[i], fields);
        const tbname = tables[i].toLowerCase();
        const wstream = fs.createWriteStream(`${fileDir}/${tbname}.model.js`);
        wstream.write(result);
      }
    }
  }

  static async createService() {
    const fileDir = `${__dirname}/${GenDir}/services/`;

    const tables = await this.GetTables();

    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i];
      this.setService(tableName);
    }

    const wstream = fs.createWriteStream(`${fileDir}/index.js`);
    let content = "";
    for (let i = 0; i < tables.length; i++) {
      let tableName = tables[i];
      const tbname = tableName.toLowerCase();
      content += `const ${tbname}Endpoint = require("./${tbname}/${tbname}.endpoint");\n`;
    }
    content += "module.exports = [\n";
    for (let i = 0; i < tables.length; i++) {
      let tableName = tables[i];
      const tbname = tableName.toLowerCase();
      content += `  ...${tbname}Endpoint,`;
    }
    content += "];\n";
    wstream.write(content);
    wstream.end();
  }

  static async createHelpers() {
    const fileDir = `${__dirname}/${GenDir}/helpers`;

    /*
        .
        .
         ---------------------------------------------------------app.helpers
        */
    let wstream = fs.createWriteStream(`${fileDir}/app.helper.js`);
    wstream.write(
      `/* eslint-disable comma-dangle */
/* eslint-disable space-in-parens */
/* eslint-disable no-plusplus */
/* eslint-disable implicit-arrow-linebreak */
const jwt = require("jsonwebtoken");

const axios = require("axios");

const bcrypt = require("bcrypt");

const dotenv = require("dotenv");


dotenv.config();

const uid = (characterCount = 10, prefix = "") => {
  let timestamp = Date.now().toString(); // Use timestamp for uniqueness
  let random = Math.floor(Math.random() * 10 ** (characterCount - timestamp.length)).toString(); // Add random number for additional uniqueness
  let uniqueNumber = timestamp + random;
  
  if (prefix !== "") {
    return prefix + uniqueNumber.toString(); // Append prefix if it is provided
  }
  
  return uniqueNumber; // Return the generated UID
};

const generateUsername = (firstName, lastName) => {
  // Convert first name and last name to lowercase
  const lowerFirstName = firstName.toLowerCase();
  const lowerLastName = lastName.toLowerCase();

  // Remove spaces and special characters from first name and last name
  const cleanedFirstName = lowerFirstName.replace(/\s/g, "").replace(/[^a-zA-Z0-9]/g, "");
  const cleanedLastName = lowerLastName.replace(/\s/g, "").replace(/[^a-zA-Z0-9]/g, "");

  // Combine the cleaned first name and last name
  const username = cleanedFirstName + cleanedLastName;

  return username;
}


const RND = () => Math.floor(Math.random() * 1000000) + 99999;

function zeroPad(aNumber) {
  return \`0\${aNumber}\`.slice(-2);
}

function MakeEscape(ddata) {
  if (ddata !== undefined) {
    if (ddata == null) {
      return "";
    }else{
      return escape(ddata);
    }
  }
  return "";
}


async function passwordEncrypt(password) {
  return new Promise((resolve, _reject) => {
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) {
        _reject(err);
      }
      resolve(hash);
    });
  });
}

function isValidPassword(password, hash) {
  // eslint-disable-next-line no-unused-vars
  return new Promise((resolve, _reject) => {
    bcrypt.compare(password, hash, (err, result) => {
      if (err) {
        _reject(err);
      }
      if (result) {
        resolve(true);
      }
      resolve(false);
    });
  });
}

function GenerateToken(content) {
  return jwt.sign({ user: content }, process.env.jwtkey);
}

function Authorization(req, res, next) {
  // eslint-disable-next-line no-unused-vars
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(401).send("Not Authorised");

  // eslint-disable-next-line consistent-return
  jwt.verify(token, process.env.jwtkey, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");
    req.user = user;
    next();
  });
}

function humanTime(timeStamp) {
  const M = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const D = new Date(timeStamp); // 23 Aug 2016 16:45:59 <-- Desired format.
  return \`\${
    M[D.getMonth()]
  } \${D.getDate()}, \${D.getFullYear()} \${D.getHours()}:\${zeroPad(
    D.getMinutes()
  )}:\${zeroPad(D.getSeconds())}\`;
}

function sqlOptions(options) {
  let str = "";
  let i = 0;
  do {
    if (i === options.length - 1) {
      str += \`\${options[i]}=?\`;
    } else {
      str += \`\${options[i]}=? &&\`;
    }
    i++;
  } while (i < options.length);

  return str;
}



async function SendMail(templateID, templateParams) {
  const options = {
    service_id: "service_KobowebTest",
    template_id: templateID,
    user_id: "V7qFJQBmM39i7kDg6",
    template_params: templateParams,
  };

  const ddata = JSON.stringify(options);

  const config = {
    method: "post",
    url: "https://api.emailjs.com/api/v1.0/email/send",
    data: ddata,
    headers: {
      "Content-Type": "application/json",
    },
  };

  await axios(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error.code);
    });
}

module.exports = {
  uid,
  RND,
  sqlOptions,
  humanTime,
  passwordEncrypt,
  isValidPassword,
  GenerateToken,
  Authorization,
  SendMail,
  generateUsername,
};
`
    );
    wstream.end();

    /*
        .
        .
         ---------------------------------------------------------console.helper
        */
    wstream = fs.createWriteStream(`${fileDir}/console.helper.js`);
    wstream.write(
      `const { log } = console;

const info = (args) => log(args);

module.exports = { info };
`
    );
    wstream.end();

    /*
        .
        .
        ---------------------------------------------------------route.helper
        */
    wstream = fs.createWriteStream(`${fileDir}/route.helper.js`);
    wstream.write(`/* eslint-disable comma-dangle */
/* eslint-disable no-restricted-syntax */
const dotenv = require("dotenv");

dotenv.config();

class RouteHelper {
  static applyRoutes(routes, router) {
    for (const route of routes) {
      const { method, path, handler } = route;
      //   console.log(\`\${process.env.NODE_ENV}\${path}\`);
      router[method](\`\${process.env.NODE_ENV}\${path}\`, handler);
    }

    // eslint-disable-next-line dot-notation
    router["get"](\`\${process.env.NODE_ENV}/\`, async (req, res) => {
      res.setHeader("content-type", "text/plain");
      const report = {
        message: "You are welcome to Koboweb",
        code: 201,
      };
      res.status(201).send(report);
      res.end();
    });
  }
}

module.exports = RouteHelper;
`);
    wstream.end();

    /*
        .
        .
        ---------------------------------------------------------db.helper
        */
    wstream = fs.createWriteStream(`${fileDir}/db.helper.js`);
    wstream.write(
      `/* eslint-disable comma-dangle */
/* eslint-disable no-console */
/* eslint-disable no-unused-vars */
const fs = require("fs");
const { connection } = require("../config/config");
const appFunctions = require("./app.helper");
const Log = require("./console.helper");

class dbhelper {
  static connection() {
    return connection;
  }

  static async execute(Model) {
    return new Promise((resolve, _reject) => {
      connection.query(Model, (_error, results) => {
        try {
          if (_error != null) {
            resolve(_error.sqlMessage);
          }
          if (results.affectedRows > -1) {
            resolve("Success");
          } else {
            resolve("Warning");
          }
        } catch (error) {
          resolve(error);
        }
      });
    });
  }

  static async columnExist(Table, Col) {
    return new Promise((resolve, _reject) => {
      const sql = \`SHOW COLUMNS FROM \${Table} LIKE "\${Col}"\`;
      connection.query(sql, (_error, results) => {
        try {
          if (_error != null) {
            resolve(_error.sqlMessage);
          }
          if (results === undefined || results.length <= 0) {
            resolve(false);
          } else {
            resolve(true);
          }
        } catch (error) {
          resolve(error);
        }
      });
    });
  }

  static async processSQLFile(fileName) {
    // Extract SQL queries from files. Assumes no ';' in the fileNames
    const queries = fs
      .readFileSync(fileName)
      .toString()
      .replace(/(\\r\\n|\\n|\\r)/gm, " ") // remove newlines
      .replace(/\\s+/g, " ") // excess white space
      .split(";") // split into all statements
      .map(Function.prototype.call, String.prototype.trim)
      .filter((el) => el.length !== 0); // remove any empty ones

    // Execute each SQL query sequentially
    queries.forEach(async (query) => {
      await this.runQuery(query);
    });
  }

  static async findTable(table, start = 0, limit = 100) {
    return new Promise((resolve, _reject) => {
      const sql = \`SELECT * FROM \${table} ORDER BY id DESC LIMIT  \${start}, \${limit}\`;

      console.log(sql);
      connection.query(sql, (_error, results) => {
        try {
          if (results === undefined || results.length === 0) {
            resolve("");
          } else {
            const resultArray = Object.values(
              JSON.parse(JSON.stringify(results))
            );
            connection.query(
              \`SELECT COUNT(*) AS dcount FROM \${table}\`,
              (_derror, dresults) => {
                const dtotal = Object.values(
                  JSON.parse(JSON.stringify(dresults))
                );
                resolve({
                  total: dtotal[0].dcount,
                  count: results.length,
                  content: resultArray,
                });
              }
            );
          }
        } catch (err) {
          console.error(err);
          resolve("");
        }
      });
    });
  }

  // -------- Return  the Total num of record in a Table using the field provided
  static async countrow(col, table, where, val) {
    return new Promise((resolve, _reject) => {
      try {
        const whereArray = appFunctions.sqlOptions(where);

        const sql = \`SELECT \${col} FROM \${table} WHERE \${whereArray}\`;
  
        connection.query(sql,val,
          (_error, results) => {
            resolve(results.length);
          }
        );
      } catch (err) {
        console.error(err);
        resolve(0);
      }
    });
  }
  // -------- Update the fields in a table with the data provided using 1 field comparison
  static update(table, set, val, where, place) {
    return new Promise((resolve, _reject) => {
      const whereArray = appFunctions.sqlOptions(where);
      const stm = \`UPDATE \${table} SET \${set}='\${val}' WHERE \${whereArray}\`;

      connection.query(stm, place, (_error, results) => {
        resolve(results);
      });
    });
  }

  // -------- Delete a record from user table  using 1 field cmparison
  static async Delete(table, where, val) {
    return new Promise((resolve, _reject) => {
      const whereArray = appFunctions.sqlOptions(where);
      const sql = \`DELETE FROM \${table} WHERE \${whereArray}\`;
      connection.query(sql, val, (_error, results) => {
        try {
          if (_error != null) {
            resolve(_error.sqlMessage);
          }
          if (results.affectedRows > -1) {
            resolve("Success");
          } else {
            resolve("Warning");
          }
        } catch (error) {
          resolve(error);
        }
        // done!
      });
    });
  }

  static async find(table, equals, where = ["id"]) {
    return new Promise((resolve, _reject) => {
      const whereArray = appFunctions.sqlOptions(where);

      const sql = \`SELECT * FROM \${table} WHERE \${whereArray}\`;

      connection.query(sql, equals, (_error, results) => {
        try {
          if (results === undefined || results.length === 0) {
            resolve("");
          } else {
            const resultArray = Object.values(
              JSON.parse(JSON.stringify(results))
            ); // --- Remove RowDataPacket
            const res = resultArray[0];
            resolve(res);
          }
        } catch (err) {
          console.error(err);
          resolve("");
        }
      });
    });
  }

  static async findAll(table, equals, where = ["id"], start = 0, limit = 100) {
    return new Promise((resolve, _reject) => {
      const whereArray = appFunctions.sqlOptions(where);

      const sql = \`SELECT * FROM \${table} WHERE \${whereArray} ORDER BY id DESC LIMIT  \${start} , \${limit}\`;

      connection.query(sql, equals, (_error, results) => {
        try {
          if (results === undefined || results.length === 0) {
            resolve("");
          } else {
            const resultArray = Object.values(
              JSON.parse(JSON.stringify(results))
            ); // --- Remove RowDataPacket
            connection.query(
              \`SELECT COUNT(*) AS dcount FROM \${table} WHERE \${whereArray} ORDER BY id\`,
              equals,
              (_derror, dresults) => {
                const dtotal = Object.values(
                  JSON.parse(JSON.stringify(dresults))
                );
                resolve({
                  total: dtotal[0].dcount,
                  count: results.length,
                  content: resultArray,
                });
              }
            );
          }
        } catch (err) {
          console.error(err);
          resolve("");
        }
      });
    });
  }

  static async findAllLike(table, equals, where = ["id"]) {
    return new Promise((resolve, _reject) => {
      let sql = \`SELECT * FROM \${table} WHERE \${where} LIKE \`;
      sql += \`"%\${equals}%"\`;
      connection.query(sql, (_error, results) => {
        try {
          if (results === undefined || results.length === 0) {
            resolve("");
          } else {
            const resultArray = Object.values(
              JSON.parse(JSON.stringify(results))
            ); // --- Remove RowDataPacket
            const res = resultArray;
            resolve(res);
          }
        } catch (err) {
          console.error(err);
          resolve("");
        }
      });
    });
  }

  static async selany(col, table, where, equals) {
    return new Promise((resolve, _reject) => {
      const sql = \`SELECT \${col} FROM \${table} WHERE \${where}=?\`;
      connection.query(sql, [equals], (error, results) => {
        try {
          if (results === undefined || results.length === 0) {
            resolve("");
          } else {
            const resultArray = Object.values(
              JSON.parse(JSON.stringify(results))
            ); // --- Remove RowDataPacket
            const res = resultArray[0][col];
            resolve(res);
          }
        } catch (err) {
          resolve("");
        }
      });
    });
  }

  static async selectlast(col, table, orderby) {
    return new Promise((resolve, _reject) => {
      const sql = \`SELECT \${col} FROM \${table} ORDER BY \${orderby} DESC LIMIT 0,1\`;
      connection.query(sql, (error, results) => {
        try {
          if (results === undefined || results.length === 0) {
            resolve("");
          } else {
            const resultArray = Object.values(
              JSON.parse(JSON.stringify(results))
            ); // --- Remove RowDataPacket
            const res = resultArray[0][col];
            resolve(res);
          }
        } catch (err) {
          resolve("");
        }
      });
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
`
    );
    wstream.end();
  }

  static async createStatic() {
    const fileDir = `${__dirname}/${GenDir}/`;
    let wstream = fs.createWriteStream(`${fileDir}/package.json`);
    wstream.write(`{
  "name": "${process.env.PROJECT}",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "keywords": [
    "${process.env.PROJECT}"
  ],
  "author": "Dan George",
  "license": "ISC",
  "dependencies": {
    "axios": "^1.2.2",
    "bcrypt": "^5.1.0",
    "body-parser": "^1.19.2",
    "chalk": "^5.2.0",
    "date-and-time": "^2.3.1",
    "dotenv": "^16.0.1",
    "ejs": "^3.1.7",
    "express": "^4.18.1",
    "express-mysql-session": "^2.1.7",
    "express-sesssion": "^1.15.5",
    "jsonwebtoken": "^8.5.1",
    "multer": "^1.4.5-lts.1",
    "mysql": "^2.18.1",
    "nodemailer": "^6.7.3",
    "nodemailer-smtp-transport": "^2.7.4",
    "nodemon": "^2.0.16",
    "socket.io": "^4.1.2",
    "sql-escape": "^1.0.1"
  },
  "devDependencies": {
    "eslint": "^8.31.0",
    "eslint-config-airbnb-base": "^15.0.0",
    "eslint-plugin-import": "^2.26.0"
  }
}
`);
    wstream.end();

    let envContent = fs.readFileSync(__dirname + "/.env");
    wstream = fs.createWriteStream(`${fileDir}/.env`);
    wstream.write(envContent.toString());
    wstream.end();

    let configContent = fs.readFileSync(__dirname + "/config.js");
    wstream = fs.createWriteStream(`${fileDir}/config/config.js`);
    wstream.write(configContent.toString());
    wstream.end();

    wstream = fs.createWriteStream(`${fileDir}/index.js`);
    wstream.write(`/* eslint-disable no-console */
/* eslint-disable comma-dangle */
/* eslint-disable consistent-return */
const express = require("express");

const dotenv = require("dotenv");

const app = express();
const bodyParser = require("body-parser");

dotenv.config();

const endpoints = require("./services");
const RouteHelper = require("./helpers/route.helper");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const bodyParseroptions = {
  inflate: true,
  limit: "100kb",
  type: "application/octet-stream",
};

app.use(bodyParser.raw(bodyParseroptions));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }

  next();
});

/* API Endpoints  */
try {
  RouteHelper.applyRoutes(endpoints, app);
} catch (error) {
  console.log(error);
}

const port = process.env.PORT;

app.listen(port, () => {
  console.log(\`Socket.IO server running at http://localhost:\${port}/\`);
});
`);
    wstream.end();
  }

  static async createProject() {
    this.createHelpers();
    this.createModel();
    this.createService();
    this.createStatic();
  }
}

module.exports = { Genesys };
