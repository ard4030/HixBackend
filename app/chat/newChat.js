const { Server } = require("socket.io");
const { OperatorsModel } = require("../model/OperatorsModel");
const { UserModel } = require("../model/UserModel");
const { SaveMessageClient, SaveMessageOperator, getMessageBySid } = require("./service.chat");
const { v4: uuidv4 } = require('uuid');
const { getCookie, generateUserChatToken, verifyUserChatToken } = require("../utils/functions");

let onlineUsers = {};  
let onlineOperators = {};  
let userToOperatorMap = {};  
let userMessages = {};  

module.exports = class ChatApplication {
    app;
    io;

    constructor(httpServer, app) {
        this.app = app;

        this.io = new Server(httpServer, {
            cors: { 
                origin: [
                    "http://localhost:5500",
                    "http://localhost:3000",
                    "http://127.0.0.1:5500"],
                credentials: true 
            },
            transports: ["websocket", "polling"],
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000,
                skipMiddlewares: true,
            },
            serveClient: true,
        });

        this.io.on("connection", async (socket) => {
            console.log("A Client Connected");

            // بررسی و دریافت SID از کوکی
            const cookies = socket.request.headers.cookie;
            const socketIDCookie = getCookie("cookieToken", cookies);

            // زمانی که کاربر یا اپراتور می‌خواهد وارد چت شود
            socket.on('join', async (data) => {
                const { apiKey, isOperator } = data;

                // Check Operator Or User
                if (isOperator) {
                    const operator = await OperatorsModel.findOne({ apikey: apiKey });
                    if (!operator) {
                        return socket.emit('message', 'API Key اپراتور نامعتبر است');
                    }

                    socket.operator = operator;
                    onlineOperators[socket.id] = operator;  
                    console.log(`Operator ${operator.userName} joined the chat`);
                    this.io.emit('updateOperatorList', Object.values(onlineOperators)); 
                    this.io.emit('updateUserList', Object.values(onlineUsers)); 
                } else {
                    // Check User Api Key
                    const user = await UserModel.findOne({ apiKey });
                    if (!user) {
                        return socket.emit('message', 'API Key نامعتبر است');
                    }

                    if (!socketIDCookie) {
                        socket.emit('requestUserInfo', 'لطفاً نام و ایمیل خود را وارد کنید:');
                    } else {
                        const details = await verifyUserChatToken(socketIDCookie)
                        socket.user = { 
                            name:details.name,
                            email:details.email,
                            id: socket.id ,
                            sid:details.sid,
                            merchantId:user._id
                        };
                        onlineUsers[socket.id] = socket.user;  
                        onlineUsers[socket.id].cookiId = details.sid;
                        console.log(`User ${details.name} joined with email: ${details.email}`);
                        this.io.emit('updateUserList', Object.values(onlineUsers)); 

                        const lastMessages = await getMessageBySid(details.sid);
                        
                        if(lastMessages && lastMessages.length>0){
                            socket.emit("loadMessages",lastMessages)
                        }else{
                            socket.emit("ready", "welcome");
                        }

                        userToOperatorMap[socket.id] = null;  
                        console.log(`Using existing socketid: ${socketIDCookie}`);
                    }   

                    
                    socket.on('userInfo', async (userData) => {
                        const { name, email } = userData;
                        if (!name || !email) {
                            return socket.emit('message', 'نام و ایمیل نمی‌تواند خالی باشد');
                        }
                        const newCookieToken = await generateUserChatToken(name,email,socket.id)
                        socket.emit("setCookie",newCookieToken)
                    });

                    
                }


                // Send Message To Operator
                socket.on('sendMessageToOperator', async (message) => {
                    const user = onlineUsers[socket.id];
                    if (user && Object.keys(onlineOperators)[0]) {
                        const operatorSocketId = Object.keys(onlineOperators)[0];
                        this.io.to(operatorSocketId).emit('newMessageFromUser', { user, message, id: socket.id });
                    } else {
                        socket.emit('message', 'در حال حاضر هیچ اپراتوری برای چت در دسترس نیست.');
                    }
                    await SaveMessageClient(message, socket.user.sid, socket.user, socket.user.merchantId);
                });

                // Send Message To User
                socket.on('sendMessageToUser', async (data) => {
                    console.log(onlineUsers)
                    console.log(data)
                    if (data.sid) {
                        this.io.to(data.sid).emit('newMessageFromOperator', data.message);
                    }
                    await SaveMessageOperator(data.message, data.cid, data, data.apiKey);
                });

                // Disconnect 
                socket.on('disconnect', () => {
                    if (socket.operator) {
                        delete onlineOperators[socket.id];  
                        this.io.emit('updateOperatorList', Object.values(onlineOperators));
                    } else if (socket.user) {
                        delete onlineUsers[socket.id];  
                        this.io.emit('updateUserList', Object.values(onlineUsers));
                    }
                });

                // Get Last Messages
                socket.on("getMessages", async (data) => {
                    const messages = await getMessageBySid(data);
                    socket.emit("setLastMessages", messages);
                });
            });
        });
    }
};
