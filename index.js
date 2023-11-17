/* eslint-disable no-console */
/* eslint-disable comma-dangle */
/* eslint-disable consistent-return */
const https = require("https");

const fs = require("fs");

// const chalk = require('chalk');

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const { Genesys } = require("./genesys");
const GenDir = "PROJECT";

let codetype, PROJECT, PORT, DB, DBPASS;

function Log(data) {
  console.clear();
  console.log(data);
}

function Clear() {
  console.clear();
}

function generate() {
  Clear();
  if (!fs.existsSync(GenDir)) {
    fs.mkdir(GenDir, { recursive: true }, (err) => {
      let fileDir = `${__dirname}/${GenDir}/public`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/.vscode`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/src/messages`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }
      fileDir = `${__dirname}/${GenDir}/src/middleware`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }
      fileDir = `${__dirname}/${GenDir}/src/models`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/src/config`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/src/services/`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/src/libs/helpers/`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/src/libs/utils/`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/src/constants/`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
        });
      }

      fileDir = `${__dirname}/${GenDir}/src/middleware/`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdir(fileDir, { recursive: true }, (err) => {
          if (err) throw err;
          Genesys.createProject();
        });
      }
    });
    console.log("Done!");
    start();
  }
}

function start() {
  const quest = `GENESYS: What can i do for you?\n
1. Generate NODE(TYPESCRIPT) > MYSQL CODE
2. Generate NODE(TYPESCRIPT) > POSTGRESQL CODE
3. Generate NODE(TYPESCRIPT) > MONGODB CODE
4. Generate NEST > MYSQL CODE
5. Generate NEST > POSTGRESQL CODE
6. Generate NEST > MONGODB CODE
0. Clear Project Folder
Note: Select from the options above Or Enter C to Close\n
YOU: `;

  rl.question(quest, (action) => {
    codetype = action;
    if (action == "c" || action == "C") {
      Log("Bye\n");
      process.exit();
    } else {
      if (action == "0") {
        fs.rmdir("PROJECT", { recursive: true }, (err) => {
          if (err) {
            console.error("Error deleting directory:", err);
            start();
          } else {
            Log("Directory deleted successfully!");
            start();
          }
        });
      } else {
        generateOption();
      }
    }
  });
}

function generateOption() {
  Clear();
  const quest =
    "\nGENESYS: Choose from the options below?\n\n1: Use .ENV to Continue\n2: Create New .ENV to Continue\n\nNote:  Enter m to return to Main OR Enter C to Close\n\nYOU:";

  rl.question(quest, (action) => {
    projname = action;
    if (action == "c" || action == "C") {
      Log("Bye\n");
      process.exit();
    } else if (action == "m" || action == "M") {
      Clear();
      start();
    } else if (action == "1") {
      generate();
    } else if (action == "2") {
      getProjectName();
    } else {
      Clear();
      start();
    }
  });
}

function getProjectName() {
  Clear();
  const quest =
    "\nGENESYS: What is your Project Name?\n\nNote:  Enter m to return to Main OR Enter C to Close\n\nYOU:";

  rl.question(quest, (action) => {
    projname = action;
    if (action == "c" || action == "C") {
      Log("Bye\n");
      process.exit();
    } else if (action == "m" || action == "M") {
      Clear();
      start();
    } else {
      PROJECT = action;
      getPort();
    }
  });
}

function getPort() {
  Clear();
  const quest =
    "\nGENESYS: Enter your preferable testing Port?\n\nNote:  Enter m to return to Main OR Enter C to Close\n\nYOU:";

  rl.question(quest, (action) => {
    projname = action;
    if (action == "c" || action == "C") {
      Log("Bye\n");
      process.exit();
    } else if (action == "m" || action == "M") {
      Clear();
      start();
    } else {
      PORT = action;
      getDatabaseName();
    }
  });
}

function getDatabaseName() {
  Clear();
  const quest =
    "\nGENESYS: What is your Database Name?\n\nNote:  Enter m to return to Main OR Enter C to Close\n\nYOU:";

  rl.question(quest, (action) => {
    projname = action;
    if (action == "c" || action == "C") {
      Log("Bye\n");
      process.exit();
    } else if (action == "m" || action == "M") {
      Clear();
      start();
    } else {
      DB = action;
      getDatabasePassword();
    }
  });
}

function getDatabasePassword() {
  Clear();
  const quest =
    "\nGENESYS: What is your Database Password?\n\nNote:  Enter m to return to Main OR Enter C to Close\n\nYOU:";

  rl.question(quest, (action) => {
    projname = action;
    if (action == "c" || action == "C") {
      Log("Bye\n");
      process.exit();
    } else if (action == "m" || action == "M") {
      Clear();
      start();
    } else {
      DBPASS = action;
      CreateENV();
    }
  });
}

function CreateENV() {
  console.log(PROJECT, DB, DBPASS, PORT);
  wstream = fs.createWriteStream(__dirname + "/dot.env");
  let envContent = `# Node/Express Server Config
PROJECT=${PROJECT}
PORT=${PORT}
DB=${DB}
DBPASS=${DBPASS}
DOMAIN=http://127.0.0.1
NODE_ENV=main
jwtkey=cryptoDBJ@9j{1ojK${PROJECT}`;
  console.log(envContent);
  wstream.write(envContent);
  wstream.end();

  Clear();

  console.log(
    ".ENV Successfully Created, Kindly update the .env with this new contents and rerun the app"
  );
  start();
}

Clear();
start();
