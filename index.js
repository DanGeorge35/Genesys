/* eslint-disable no-console */
/* eslint-disable comma-dangle */
/* eslint-disable consistent-return */
const express = require("express");

const fs = require("fs");

const app = express();

const { Genesys } = require("./genesys");

const port = 1001;

const GenDir = "PROJECT";

if (!fs.existsSync(GenDir)) {
  fs.mkdir(GenDir, { recursive: true }, (err) => {
    let fileDir = `${__dirname}/${GenDir}/model`;
    if (!fs.existsSync(fileDir)) {
      fs.mkdir(fileDir, { recursive: true }, (err) => {
        if (err) throw err;
        fileDir = `${__dirname}/${GenDir}/services/`;
        if (!fs.existsSync(fileDir)) {
          fs.mkdir(fileDir, { recursive: true }, (err) => {
            if (err) throw err;
            const fileDir = `${__dirname}/${GenDir}/helpers/`;
            if (!fs.existsSync(fileDir)) {
              fs.mkdir(fileDir, { recursive: true }, (err) => {
                if (err) throw err;
                const fileDir = `${__dirname}/${GenDir}/config/`;
                if (!fs.existsSync(fileDir)) {
                  fs.mkdir(fileDir, { recursive: true }, (err) => {
                    if (err) throw err;
                    Genesys.createProject();
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}

app.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
