/* eslint-disable no-console */
/* eslint-disable comma-dangle */
/* eslint-disable consistent-return */
const fs = require("fs");

// const chalk = require('chalk');

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


const { Genesys } = require("./genesys");
const GenDir = "PROJECT";

let codetype,projname;

function Log(data){
  console.clear();
  console.log(data);
}

function Clear(){
  console.clear();
}

function clean(){

}

function generate(){
  if (!fs.existsSync(GenDir)) {
    fs.mkdir(GenDir, { recursive: true }, (err) => {
      let fileDir = `${__dirname}/${GenDir}/models`;
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
        console.log("Done!");
        start();
      }
    });
  }
}

 function start() {

  const quest= `GENESYS: What can i do for you?\n
1. Generate NODE > MYSQL CODE   
2. Generate NODE > POSTGRESQL CODE
3. Generate NODE > MONGODB CODE
4. Generate TYPESCRIPT > MYSQL CODE
5. Generate TYPESCRIPT > POSTGRESQL CODE
6. Generate TYPESCRIPT > MONGODB CODE
7. Generate NEST > MYSQL CODE
8. Generate NEST > POSTGRESQL CODE
9. Generate NEST > MONGODB CODE
0. Clear Project Folder
Note: Select from the options above Or Enter C to Close\n
YOU: `;

   rl.question(quest, (action) => {
    codetype = action;
    if((action == "c") ||(action == "C")){
      Log("Bye\n");
      process.exit();
    }else{
      if(action =="0"){
        fs.rmdir("PROJECT", { recursive: true }, (err) => {
          if (err) {
            console.error('Error deleting directory:', err);
            start();
          } else {
            Log('Directory deleted successfully!');
            start();
          }
        });
      }else{
        generateOption();
      }
    }
  });
  
}

function generateOption() {
  Clear();
  const quest= '\nGENESYS: Choose from the options below?\n\n1: Use .ENV to Continue\n2: Create New .ENV to Continue\n\nNote:  Enter m to return to Main OR Enter C to Close\n\nYOU:';

  rl.question(quest, (action) => {
    projname = action;
    if((action == "c") ||(action == "C")){
      Log("Bye\n");
      process.exit();
    }else if((action == "m") ||(action == "M")){
      Clear();
     start();
    }else if(action == "1"){
      Clear();
      generate();
    }else if(action == "2"){
      getProjectName()
    }else{
      Clear();
      start();
    }
  });
}
 
function getProjectName() {

  const quest= '\nGENESYS: What is your Project Name?\n\nNote:  Enter m to return to Main OR Enter C to Close\n\nYOU:';

  rl.question(quest, (action) => {
    projname = action;
    if((action == "c") ||(action == "C")){
      Log("Bye\n");
      process.exit();
    }else if((action == "m") ||(action == "M")){
      Clear();
     start();
    }else{
      
    }
  });

  
}

Clear();
 start();
