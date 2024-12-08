const Application = require("./app/server");
require("dotenv").config();
new Application(process.env.DB_URL,process.env.PORT);