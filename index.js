/* eslint-disable no-console */
/* eslint-disable comma-dangle */
/* eslint-disable consistent-return */
const express = require("express");
const app = express();

const { Genesis } = require("./genesys");

const port = 1001;

let fileDir = `${__dirname}/${GenDir}/model`;
if (!fs.existsSync(fileDir)) {
  fs.mkdir(fileDir, { recursive: true }, (err) => {
    if (err) throw err;
    fileDir = `${__dirname}/${GenDir}/services/${tbname}`;
    if (!fs.existsSync(fileDir)) {
      fs.mkdir(fileDir, { recursive: true }, (err) => {
        if (err) throw err;
        const fileDir = `${__dirname}/${GenDir}/helpers/`;
        if (!fs.existsSync(fileDir)) {
          fs.mkdir(fileDir, { recursive: true }, (err) => {
            if (err) throw err;
          });
        }
      });
    }
  });
}

// Genesis.createService("person");
Genesis.createModel();

app.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
