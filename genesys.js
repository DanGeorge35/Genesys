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
    const type = Array();
    const results = await DbHelper.runQuery(`DESCRIBE ${tableName}`);

    for (let i = 0; i < results.length; i++) {
      name.push(results[i].Field);
      required.push(results[i].Null);
      type.push(results[i].Type);
    }
    return { name, required, type };
  }

  static async setTableModel(tableName, fields) {
    const tbname = tableName.toLowerCase();
    // remove _ from tbname and make the first letter after _ capital letter making it camel case
    let modelName = "";
    if (tbname.includes("_")) {
      let strs = tbname.split("_");
      for (var i in strs) {
        if (strs[i]) {
          modelName += strs[i].charAt(0).toUpperCase() + strs[i].slice(1);
        }
      }
    }

    const TableName = tbname.charAt(0).toUpperCase() + tbname.slice(1);

    let model = `import { DataTypes } from "sequelize"; \nimport sequelize from "../config/db";\n\nconst ${TableName} = sequelize.define(\n   "${tableName}",\n  {\n`;
    for (let i = 0; i < fields.name.length; i++) {
      if (fields.name[i] === "id") {
        model += `      ${fields.name[i]}: {
        primaryKey: true,
        autoIncrement: true,
        type: DataTypes.INTEGER,
      },\n`;
      } else {
        let fieldtype,
          allowNull = "";
        if (fields.type[i] === "int") {
          fieldtype = "INTEGER";
        } else if (fields.type[i] === "bigint") {
          fieldtype = "BIGINT";
        } else {
          fieldtype = "STRING";
        }
        if (fields.required[i] === "YES") {
          allowNull = "true";
        } else {
          allowNull = "false";
        }
        model += `      ${fields.name[i]}: {
        type: DataTypes.${fieldtype},
        allowNull:${allowNull},
      },\n`;
      }
    }

    model += `  },\n  {\n\n  }\n);\n
${TableName}.sync().then(() => {}).catch((err: any) => {
        console.error('Error creating ${TableName} table:', err);
});

export default ${TableName};\n`;

    return model;
  }

  static async setService(tableName, fields) {
    const tbname = tableName.toLowerCase();
    const TableName = tbname.charAt(0).toUpperCase() + tbname.slice(1);
    const fileDir = `${__dirname}/${GenDir}/src/services/${tbname}`;

    if (!fs.existsSync(fileDir)) {
      fs.mkdir(fileDir, { recursive: true }, (err) => {
        if (err) throw err;
        /*
        .
        .
         ---------------------------------------------------------Endpoints
        */
        let wstream = fs.createWriteStream(`${fileDir}/${tbname}.endpoint.ts`);
        wstream.write(
          `import ${TableName}Controller from "./${tbname}.controller";
import { Authorization } from "../../libs/utils/app.utility";

const ENDPOINT_URL = "/api/v1/${tbname}";
const ${TableName}Endpoint = [
  {
    path: \`\${ENDPOINT_URL}/\`,
    method: "post",
    handler: [Authorization, ${TableName}Controller.create${TableName}],
  },
   {
    path: \`\${ENDPOINT_URL}/:id\`,
    method: "patch",
    handler: [Authorization, ${TableName}Controller.update${TableName}],
  },
  {
    path: \`\${ENDPOINT_URL}/\`,
    method: "get",
    handler: [${TableName}Controller.getall${TableName}],
  },
  {
    path: \`\${ENDPOINT_URL}/:id\`,
    method: "get",
    handler: [${TableName}Controller.getSingle${TableName}],
  },
  {
    path: \`\${ENDPOINT_URL}/:id\`,
    method: "delete",
    handler: [Authorization, ${TableName}Controller.delete${TableName}],
  },
];

export default ${TableName}Endpoint;

`
        );
        wstream.end();

        /*
  .
  .
    ---------------------------------------------------------Controller
  */

        let HasUpload = false;
        let Uploads = [];
        let dController = "";
        let CreateControler = "";

        for (let i = 0; i < fields.name.length; i++) {
          const dfield = fields.name[i];
          const tdfield = dfield.toLowerCase();
          if (
            tdfield.includes("picture") ||
            tdfield.includes("image") ||
            tdfield.includes("photo") ||
            tdfield.includes("upload") ||
            tdfield.includes("img")
          ) {
            HasUpload = true;
            Uploads.push(dfield);
          }
        }

        if (HasUpload === true) {
          dController += `/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable-next-line @typescript-eslint/no-misused-promises */
import fs from "fs";
import ${TableName} from "../../models/${tbname}.model";
import ${TableName}Validation from "./${tbname}.validation";
import { IncomingForm } from 'formidable';
import { RenameUploadFile,getUIDfromDate,adjustFieldsToValue } from "../../libs/utils/app.utility";

class ${TableName}Controller {
        `;

          CreateControler = `
  /**
 * Create ${TableName} Endpoint.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<any>} A Promise that resolves to the response.
 */
public static async create${TableName} (req: any, res: any, next: any): Promise<any> {
  const form = new IncomingForm({ multiples: false });
  form.parse(req, async (err, fields, files) => {
     try {
          if (err) {
            return res
              .status(400)
              .json({ code: 400, message: "Error parsing the request" });
          }
          const dir = "/public/${tbname}";
          if (!fs.existsSync(\`.\${dir}\`)) {
            fs.mkdirSync(\`.\${dir}\`);
          }
          const data:any =  adjustFieldsToValue(fields);
          const validate = await ${TableName}Validation.validateCreate${TableName}(data);

          if (validate.result === "error") {
            const result: { code: number; message: string } = {
            code : 400,
            message : validate.message
            }
            return res.status(result.code).send(result);
          }

          // Check if ${tbname} aldready exist
          const checkExist = await ${TableName}.findOne({ where: {...data} });
          if (checkExist !== null) {
            return res.status(400).send({
              message: "Record Already Exist In Server",
              code: 400,
            });
          }


          const DID =   getUIDfromDate();

           if(data.Signature !== undefined){
            const signature = \`\${DID}-SIG\`;
            const base64Str = data.Signature;
            const base64 = base64Str.replace("data:image/png;base64,", "");
            const imagePath = \`.\${dir}/\${signature}.png\`;
            const buffer = Buffer.from(base64, "base64");
            fs.writeFileSync(imagePath, buffer);
            data.Signature = \`\${process.env.DOMAIN}/\${process.env.NODE_ENV}\${dir}/\${signature}.png\`;
          }
          `;

          for (let i = 0; i < Uploads.length; i++) {
            const updfield = Uploads[i];
            CreateControler += `
          if(files.${updfield} !== undefined){
            const ${updfield} = files.${updfield}[0];
            data.${updfield}= RenameUploadFile(${updfield},\`\${dir}/\${DID}-PHOTO\`);
          }`;
          }

          for (let i = 0; i < Uploads.length; i++) {
            const updfield = Uploads[i];
            CreateControler += `
            if( files.${updfield} === undefined){
              return res.status(400).send({code:400,message:"${updfield} must be uploaded"});
            }`;
          }
          CreateControler += `

        const new${TableName} = await ${TableName}.create({...data});
          res.status(201).json({ success: true, data: new${TableName} });

        } catch (error:any) {
          const err = { code: 400, message: \`SYSTEM ERROR : \${error.message}\` };
          console.error(error);
          return res.status(400).send(err);
        }
      });
}
`;
        } else {
          dController += `/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable-next-line @typescript-eslint/no-misused-promises */
import fs from "fs";
import { getUIDfromDate, EncryptPassword, GenerateToken, CheckPassword } from '../../libs/utils/app.utility'
import ${TableName} from "../../models/${tbname}.model";
import ${TableName}Validation from "./${tbname}.validation";
import { getUIDfromDate } from "../../libs/utils/app.utility";

class ${TableName}Controller {
        `;

          CreateControler = `
/**
 * Create ${TableName}
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<any>} A Promise that resolves to the response.
 */
static async create${TableName} (req: any, res: any, next: any): Promise<any> {
    try {
        const data = req.body;
        const validate = await ${TableName}Validation.validateCreate${TableName}(data);
        if (validate.result === "error") {
            const result: { code: number; message: string } = {
            code : 400,
            message : validate.message
            }
            return res.status(result.code).send(result);
        }
          const dir = "/public/${tbname}";
          if (!fs.existsSync(\`.\${dir}\`)) {
            fs.mkdirSync(\`.\${dir}\`);
          }

          const checkExist = await ${TableName}.findOne({ where: {...data} });
          if (checkExist !== null) {
            return res.status(400).send({
              message: "This ${TableName} Record Already Exist",
              code: 400,
            });
          }

          const DID =   getUIDfromDate("ATD");
            if (data.Signature !== undefined) {
              const Signature = \`\${DID}-SIG\`;
              const base64Str = data.Signature;
              const base64 = base64Str.replace("data:image/png;base64,", "");
              const imagePath = \`.\${dir}/\${Signature}.png\`;
              const buffer = Buffer.from(base64, "base64");
              fs.writeFileSync(imagePath, buffer);
              data.Signature = \`\${process.env.DOMAIN}/\${process.env.NODE_ENV}\${dir}/\${Signature}.png\`;
            }


      const d${TableName} = await ${TableName}.create({...data});

      res.status(201).json({ success: true, data: d${TableName} });

    } catch (error:any) {
      return res.status(400).send({
        message: error.message,
        code: 400,
      });
    }
  };
  `;
        }

        dController += CreateControler;

        dController += `
/**
 * Single ${TableName}
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<any>} A Promise that resolves to the response.
 */
  static async getSingle${TableName} (req: any, res: any, next: any): Promise<any> {
    try {

        const { id } = req.params;

        const single${TableName} = await ${TableName}.findOne({ where: { id:id } });

        if(!single${TableName}){
            res.status(400).json({ success: false, data: \`No ${TableName} with the id \${req.params.id}\` });
        }

        res.status(200).json({ success: true, data: single${TableName} })

   } catch (error:any) {
          const err = { code: 400, message: \`SYSTEM ERROR : \${error.message}\` };
          console.error(error);
          return res.status(400).send(err);
    }
  }

/**
 * Get All ${TableName}
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<any>} A Promise that resolves to the response.
 */
    static async getall${TableName} (req: any, res: any, next: any): Promise<any> {
        const PAGE_SIZE = 10;

        try {
            let page: number = 1;

            if (req.query.page && typeof req.query.page === 'string') {
                page = parseInt(req.query.page, 10);
            }

            const all${TableName} = await ${TableName}.findAndCountAll({
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            });

            const totalPages = Math.ceil(all${TableName}.count / PAGE_SIZE);

            res.status(200).json({
                success: true,
                data: all${TableName}.rows,
                pagination: {
                    currentPage: page,
                    totalPages: totalPages,
                    pageSize: PAGE_SIZE,
                }
            });

       } catch (error:any) {
          const err = { code: 400, message: \`SYSTEM ERROR : \${error.message}\` };
          console.error(error);
          return res.status(400).send(err);
        }
    }

/**
 * Update ${TableName}
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<any>} A Promise that resolves to the response.
 */
    static async update${TableName} (req: any, res: any, next: any): Promise<any> {
        try {
            const agentId = req.params.id;
            const updatedInfo = req.body;

            const agent = await ${TableName}.findByPk(agentId);

            if (!agent) {
                return res.status(404).json({ success: false, message: '${TableName} not found' });
            }

            await agent.update(updatedInfo);

            res.status(200).json({ success: true, data: agent, message: '${TableName} information updated' });
        } catch (error:any) {
          const err = { code: 400, message: \`SYSTEM ERROR : \${error.message}\` };
          console.error(error);
          return res.status(400).send(err);
        }
    }


/**
 * Delete ${TableName}
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<any>} A Promise that resolves to the response.
 */
      static async delete${TableName} (req: any, res: any, next: any): Promise<any> {
      try {
        const ${tbname}Id = req.params.id;

        const ${tbname} = await ${TableName}.findByPk(${tbname}Id);

        if (!${tbname}) {
          return res
            .status(404)
            .json({ success: false, message: "${TableName} not found" });
        }

        await ${tbname}.destroy();

        res.status(200).json({ success: true, message: "${TableName} deleted" });
      } catch (error:any) {
          const err = { code: 400, message: \`SYSTEM ERROR : \${error.message}\` };
          console.error(error);
          return res.status(400).send(err);
      }
    }

}

export default ${TableName}Controller;
`;

        wstream = fs.createWriteStream(`${fileDir}/${tbname}.controller.ts`);
        wstream.write(dController);
        wstream.end();

        /*
  .
  .
    ---------------------------------------------------------Validation
  */

        wstream = fs.createWriteStream(`${fileDir}/${tbname}.validation.ts`);
        let valid = `/* eslint-disable @typescript-eslint/no-extraneous-class */\nimport Joi from "joi";\n
const schema = Joi.object({\n`;
        for (let i = 0; i < fields.name.length; i++) {
          if (
            fields.name[i] === "UpdatedAT" ||
            fields.name[i] === "status" ||
            fields.name[i] === "Status" ||
            fields.name[i] === "updatedAt" ||
            fields.name[i] === "CreatedAT" ||
            fields.name[i] === "createdAt"
          ) {
            continue;
          } else if (Uploads.includes(fields.name[i])) {
            valid += `  ${fields.name[i]}: Joi.any().optional(),\n`;
            continue;
          }
          valid += `  ${fields.name[i]}: Joi.string().required().min(1),\n`;
        }
        valid += `});
// name : Joi.any().optional(); // for optional entry

  class ${TableName}Validation {
        static async validateCreate${TableName}(data:any):  Promise<any> {
          const { error, value } = schema.validate(data);
          if (error!= null) {
              error.details[0].message = error.details[0].message.replace(/\\\\|"|\\\\/g, '');
              return { "result" : "error", "message" : error.details[0].message };
          }
          return { "result" : "success", "message" : value };
      }
  }


export default  ${TableName}Validation;

/*--------------------------------------------------------- POSTMAN TEST DATA STRUCTURE\n`;

        if (HasUpload == false) {
          valid += ` { \n`;
          for (let i = 0; i < fields.name.length; i++) {
            if (i < fields.name.length - 1) {
              valid += `    "${fields.name[i]}" : "",\n`;
            } else {
              valid += `    "${fields.name[i]}" : ""\n`;
            }
          }
          valid += `  } \n`;
        } else {
          for (let i = 0; i < fields.name.length; i++) {
            valid += `  ${fields.name[i]}\n`;
          }
        }
        valid += `--------------------------------------------------------- POSTMAN TEST DATA STRUCTURE*/`;

        wstream.write(valid);
        wstream.end();
      });
    }
  }

  static async createModel(tableName = "") {
    const fileDir = `${__dirname}/${GenDir}/src/models`;
    if (tableName === "") {
      const tables = await this.GetTables();
      for (let i = 0; i < tables.length; i++) {
        const fields = await this.GetFields(tables[i]);
        const result = await this.setTableModel(tables[i], fields);
        const tbname = tables[i].toLowerCase();
        const wstream = fs.createWriteStream(`${fileDir}/${tbname}.model.ts`);
        wstream.write(result);
      }
    }
  }

  static async createService() {
    const fileDir = `${__dirname}/${GenDir}/src/services/`;

    const tables = await this.GetTables();

    for (let i = 0; i < tables.length; i++) {
      const tableName = tables[i];
      const fields = await this.GetFields(tables[i]);
      this.setService(tableName, fields);
    }

    const wstream = fs.createWriteStream(`${fileDir}/index.ts`);
    let content = "";
    for (let i = 0; i < tables.length; i++) {
      let tableName = tables[i];
      const tbname = tableName.toLowerCase();
      content += `import ${tbname}Endpoint  from './${tbname}/${tbname}.endpoint'\n`;
    }

    content += "\n\nexport default [\n";
    for (let i = 0; i < tables.length; i++) {
      let tableName = tables[i];
      const tbname = tableName.toLowerCase();
      content += `  ...${tbname}Endpoint,\n`;
    }
    content += "];\n";
    wstream.write(content);
    wstream.end();
  }

  static async createPostmanCalls() {
    console.log("EHY");
    const fileDir = `${__dirname}/${GenDir}/`;
    const tables = await this.GetTables();
    let postman_calls = "";
    postman_calls += `{
  "info": {
    "_postman_id": "44799335-29d0-46da-bfc3-73f4af37f4c1",
    "name": "${process.env.PROJECT}",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  "item": [
`;

    for (let i = 0; i < tables.length; i++) {
      const tbname = tables[i].toLowerCase();
      const TableName = tbname.charAt(0).toUpperCase() + tbname.slice(1);
      const fields = await this.GetFields(tables[i]);

      postman_calls += `         {
                        "name": "${TableName}",
                        "item": [
            `;

      postman_calls += `
                              "item": [
                                {
                                  "name": "Get ${TableName}",
                                  "protocolProfileBehavior": {
                                    "disableBodyPruning": true
                                  },
                                  "request": {
                                    "auth": {
                                      "type": "bearer",
                                      "bearer": [
                                        {
                                          "key": "token",
                                          "value": "{{TOKEN}}",
                                          "type": "string"
                                        }
                                      ]
                                    },
                                    "method": "GET",
                                    "header": [],
                                    "body": {
                                      "mode": "raw",
                                      "raw": ""
                                    },
                                    "url": {
                                      "raw": "{{BASE_URL}}/api/${tbname}",
                                      "host": [
                                        "{{BASE_URL}}"
                                      ],
                                      "path": [
                                        "api",
                                        "${tbname}"
                                      ]
                                    }
                                  },
                                  "response": []
                                },
                                {
                                  "name": "Get Single ${TableName}",
                                  "protocolProfileBehavior": {
                                    "disableBodyPruning": true
                                  },
                                  "request": {
                                    "auth": {
                                      "type": "bearer",
                                      "bearer": [
                                        {
                                          "key": "token",
                                          "value": "{{TOKEN}}",
                                          "type": "string"
                                        }
                                      ]
                                    },
                                    "method": "GET",
                                    "header": [],
                                    "body": {
                                      "mode": "raw",
                                      "raw": ""
                                    },
                                    "url": {
                                      "raw": "{{BASE_URL}}/api/${tbname}/:id",
                                      "host": [
                                        "{{BASE_URL}}"
                                      ],
                                      "path": [
                                        "api",
                                        "${tbname}",
                                        ":id"
                                      ]
                                    }
                                  },
                                  "response": []
                                },
                                {
                                  "name": "Update ${TableName}",
                                  "request": {
                                    "auth": {
                                      "type": "bearer",
                                      "bearer": [
                                        {
                                          "key": "token",
                                          "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoyLCJVc2VySUQiOiJsZG43dmhvZThyMzFxYWttbjluIiwiRmlyc3ROYW1lIjoiU3VwZXIiLCJMYXN0TmFtZSI6IkFkbWluIiwiRW1haWwiOiJzdXBlcmFkbWluQGtvYm93ZWIuY29tIiwiUm9sZSI6IlN1cGVyQWRtaW4iLCJVc2VyVHlwZSI6IkFkbWluIiwiUGFzc3dvcmRIYXNoIjoiJDJiJDEwJGxjSmRSaGNibEptSXJjdHdUNThjMy5kclQyVHU1Y3JwT1Y5TXNvSm8wckx6VkJub1QwOThtIiwiUGFzc3dvcmRTYWx0Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjpbMzYsNTAsOTgsMzYsNDksNDgsMzYsMTA4LDk5LDc0LDEwMCw4MiwxMDQsOTksOTgsMTA4LDc0LDEwOSw3MywxMTQsOTksMTE2LDExOSw4NCw1Myw1Niw5OSw1MSw0NiwxMDAsMTE0LDg0LDUwLDg0LDExNyw1Myw5OSwxMTQsMTEyLDc5LDg2LDU3LDc3LDExNSwxMTEsNzQsMTExLDQ4LDExNCw3NiwxMjIsODYsNjYsMTEwLDExMSw4NCw0OCw1Nyw1NiwxMDldfSwiUmVmcmVzaFRva2VuIjoiIiwiVG9rZW4iOiI3MzE5IiwiVG9rZW5DcmVhdGVkIjoiMTY3NTM0OTU2NDk5MCIsIlRva2VuRXhwaXJlcyI6IjE2Nzc5NDE1NjQ5OTAiLCJWZXJpZmllZCI6MSwiQ3JlYXRlZEFUIjoiIn0sImlhdCI6MTY3NjkxMDU5OH0.ltidwUCOpvyQ5SX1yq4bsWaXlihLtrsNcMYOB3z_TgM",
                                          "type": "string"
                                        }
                                      ]
                                    },
                                    "method": "PUT",
                                    "header": [
                                      {
                                        "key": "Content-Type",
                                        "value": "application/json",
                                        "type": "text"
                                      }
                                    ],
                                    "body": {
                                      "mode": "raw",
                                      "raw": "{\\n    \\"status\\":\\"test\\",\\n }"
                                    },
                                    "url": {
                                      "raw": "{{BASE_URL}}/api/${tbname}/",
                                      "host": [
                                        "{{BASE_URL}}"
                                      ],
                                      "path": [
                                        "api",
                                        "${tbname}",
                                        ""
                                      ]
                                    }
                                  },
                                  "response": []
                                },
                                {
                                  "name": "Delete ${TableName}",
                                  "request": {
                                    "auth": {
                                      "type": "bearer",
                                      "bearer": [
                                        {
                                          "key": "token",
                                          "value": "{{TOKEN}}",
                                          "type": "string"
                                        }
                                      ]
                                    },
                                    "method": "DELETE",
                                    "header": [],
                                    "body": {
                                      "mode": "formdata",
                                      "formdata": []
                                    },
                                    "url": {
                                      "raw": "{{BASE_URL}}/api/${tbname}/:id",
                                      "host": [
                                        "{{BASE_URL}}"
                                      ],
                                      "path": [
                                        "api",
                                        "Engagements",
                                        ":id"
                                      ]
                                    }
                                  },
                                  "response": []
                                },
                                {
                                  "name": "Create ${TableName}",
                                  "event": [
                                    {
                                      "listen": "test",
                                      "script": {
                                        "exec": [
                                          ""
                                        ],
                                        "type": "text/javascript"
                                      }
                                    },
                                    {
                                      "listen": "prerequest",
                                      "script": {
                                        "exec": [
                                          ""
                                        ],
                                        "type": "text/javascript"
                                      }
                                    }
                                  ],
                                  "request": {
                                    "auth": {
                                      "type": "bearer",
                                      "bearer": [
                                        {
                                          "key": "token",
                                          "value": "{{TOKEN}}",
                                          "type": "string"
                                        }
                                      ]
                                    },
                                    "method": "POST",
                                    "header": [
                                      {
                                        "key": "Content-Type",
                                        "value": " application/json",
                                        "type": "text"
                                      }
                                    ],
                                    "body": {
                                      "mode": "raw",
                                      "raw": "{\\r\\n  `;
      for (let i = 0; i < fields.name.length; i++) {
        let fdname = fields.name[i];
        postman_calls += `\\"${fdname}\\":\\"test\\",\\r\\n`;
      }

      postman_calls += `}\\r\\n"
                                    },
                                    "url": {
                                      "raw": "{{BASE_URL}}/api/${tbname}/",
                                      "host": [
                                        "{{BASE_URL}}"
                                      ],
                                      "path": [
                                        "api",
                                        "${tbname}",
                                        ""
                                      ]
                                    }
                                  },
                                  "response": []
                                },
                              ]`;
    }
    console.log("EHY3");
    postman_calls += `	],
            "auth": {
              "type": "bearer"
            },
            "event": [
              {
                  "listen": "prerequest",
                  "script": {
                    "type": "text/javascript",
                    "exec": [
                      ""
                    ]
                  }
                },
                {
                  "listen": "test",
                  "script": {
                    "type": "text/javascript",
                    "exec": [
                      ""
                    ]
                  }
                }
              ]
          }
          `;
    console.log("EHY4");

    const wstream = fs.createWriteStream(
      `${fileDir}/${process.env.PROJECT}.postman_byGenesis.json`
    );
    wstream.write(postman_calls);
    wstream.end();
  }

  static async createHelpers() {
    const fileDir = `${__dirname}/${GenDir}/src/libs/`;

    /*
        .
        .
         ---------------------------------------------------------app.helpers
        */
    let wstream = fs.createWriteStream(`${fileDir}/utils/app.helper.ts`);
    wstream.write(
      `import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import fs from 'fs'
import { type Fields } from 'formidable'

function Authorization (req: any, res: any, next: any): any {
  // eslint-disable-next-line no-unused-vars
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]
  if (token == null) return res.status(401).send('Not Authorised')

  // eslint-disable-next-line consistent-return
  const JWT_KEY: any = process.env.jwtkey
  jwt.verify(token, JWT_KEY, (err: any, user: any) => {
    if (err !== null) return res.status(403).send('Invalid Token')
    req.user = user
    next()
  })
}

function GenerateToken (data: any): string {
  const JWT_SECRET: any = process.env.jwtkey
  return jwt.sign({ data }, JWT_SECRET, { expiresIn: '30d' })
}
async function CheckPassword (password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

async function EncryptPassword (password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

function adjustFieldsToValue (
  fieldsObject: Fields<string>
): Record<string, string> {
  const adjustedFields: Record<string, string> = {}

  for (const fieldName in fieldsObject) {
    if (fieldName in fieldsObject) {
      const fieldValue = fieldsObject[fieldName]?.[0] ?? '' // Using optional chaining and nullish coalescing
      adjustedFields[fieldName] = fieldValue
    }
  }
  return adjustedFields
}

function RenameUploadFile (uploadedfile: any, filename: string): string {
  const oldPath = uploadedfile.filepath
  const extension = uploadedfile.originalFilename.substring(
    uploadedfile.originalFilename.lastIndexOf('.')
  )
  const newPath = \`.\${filename}\${extension}\`
  const publicPath = \`\${process.env.DOMAIN}/\${process.env.NODE_ENV}\${filename}\${extension}\`
  fs.renameSync(oldPath, newPath)
  return publicPath
}

function getUIDfromDate (prefix = ''): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // Months are zero-based
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const random = (Math.floor(Math.random() * 9) + 1).toString()
  const uniqueNumber =
    year.toString() +
    month.toString() +
    day.toString() +
    hour.toString() +
    minute.toString() +
    second.toString() +
    random.substring(0, 2)
  // uniqueNumber = uniqueNumber.substring(uniqueNumber.length - length);

  if (prefix !== '') {
    return prefix + uniqueNumber.toString() // Append prefix if it is provided
  }
  return \`IDN\${uniqueNumber.toString()}\`
}

export {
  Authorization,
  GenerateToken,
  EncryptPassword,
  CheckPassword,
  RenameUploadFile,
  adjustFieldsToValue,
  getUIDfromDate
}
`
    );
    wstream.end();

    /*
        .

    /*
        .
        .
        ---------------------------------------------------------route.helper
        */
    wstream = fs.createWriteStream(`${fileDir}/helpers/route.helper.ts`);
    wstream.write(`/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-extraneous-class */
import dotenv from 'dotenv'
import { type Router } from 'express'

import RateLimit from 'express-rate-limit'

let limiter: any

dotenv.config()

function rateLimitHandler (req: any, res: any, windowMs: any): void {
  res.setHeader('Retry-After', Math.ceil(windowMs / 1000))
  console.log(\`Rate limit exceeded for ip: \${req.ip}\`)
  return res
    .status(429)
    .send({ message: \`Rate limit exceeded for ip: \${req.ip}\`, code: 429 })
}

class RouteHelper {
  static initRoutes (routes: any[], router: Router): any {
    for (const route of routes) {
      const { method, path, handler } = route;
      (router as any)[method](\`/\${process.env.NODE_ENV}\${path}\`, handler)
    }
    router.get(\`/\${process.env.NODE_ENV}\`, (req: any, res: any) => {
      res.setHeader('content-type', 'application/json')
      const report = {
        message: 'You are welcome to Acresal',
        code: 201
      }
      res.status(201).send(report)
    })
  }

  static getLimiter (): any {
    return limiter
  }

  static handleRateLimiter (router: any): any {
    limiter = RateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      handler (req, res) {
        console.log('here')
        rateLimitHandler(req, res, 15 * 60 * 1000)
      }
    })
    router.use(limiter)
  }
}

export default RouteHelper
`);
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
    "formidable": "^3.5.0",
    "joi": "^17.9.2",
    "express-mysql-session": "^2.1.7",
    "express-sesssion": "^1.15.5",
    "joi": "^17.9.2",
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
    wstream.write(`const express = require("express");

const path = require("path");

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

app.use(
  \`\${process.env.NODE_ENV}/public\`,
  express.static(path.join(__dirname, "public"))
);

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
    // this.createStatic();
    // this.createPostmanCalls();
  }
}

module.exports = { Genesys };
