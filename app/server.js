const path = require("path");
const http = require("http");
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const { AllRoutes } = require("./router/router");
const ChatApplication = require("./chat/chat");
const bodyParser = require("body-parser");

module.exports = class Application{
    #express = require("express");
    #app = this.#express();
    constructor(DB_URL,PORT){
        this.configDatabase(DB_URL)
        this.configApplication()
        this.createRoutes()
        this.createServer(PORT)
        this.errorHandler()
    }

    configApplication(){
        this.#app.use(bodyParser())
        this.#app.use(cookieParser());
        this.#app.use(cors({
            credentials: true,
            origin: [
                "https://hix-operator.vercel.app",
                "http://localhost:5500",
                "http://localhost:3000",
                "http://localhost:3200",
                "http://127.0.0.1:5500",
                "https://hixnew.liara.run",
                "http://localhost:5173"
            ],
        }));

        this.#app.use(this.#express.static(path.join(__dirname, "..")));
        this.#app.use(this.#express.json({limit: '50mb'}));
        this.#app.use(this.#express.urlencoded({limit: '50mb',extended : true}));

    }

    createServer(PORT){
        const server = http.createServer(this.#app);
        server.listen(PORT, () => {
            console.log(`Server Run > On  http://localhost:${PORT}`)
        })

        const chatServer = new ChatApplication(server,this.#app);
    }

    async configDatabase(DB_URL){
        try {
            await mongoose.connect(DB_URL);
            console.log("Connect to DB successful...")
          } catch (error) {
            console.log(error);
          }
    }

    errorHandler(){
        this.#app.use((req, res, next) => {
            return res.status(404).json({
                status : 404,
                success : false,
                message : "صفحه یا ادرس مورد نظر یافت نشد"
            })
        });
        this.#app.use((error, req, res, next) => {
            const status = error?.status || 500;
            const message = error?.message || "InternalServerError";
            return res.status(200).json({
                status,
                success : false,
                message
            })
        })
    }
    createRoutes(){
        this.#app.get("/", (req, res, next) => {
            return res.json({
                message : "this is a new Express application"
            })
        })
        this.#app.use(AllRoutes)
        // this.#app.use((err, req, res, next) => {
        //     try {
        //     } catch (error) {
        //         next(error)
        //     }
        // })
    }

}
