const { Server } = require("socket.io");
const { OperatorsModel } = require("../model/OperatorsModel");
const { UserModel } = require("../model/UserModel");
const { SaveMessageClient, SaveMessageOperator, getMessageBySid } = require("./chat.service");
const { v4: uuidv4 } = require('uuid');
const { getCookie, generateUserChatToken, verifyUserChatToken, getUserAndOperatorBySocketID, getOperatorsByMerchantId, getUsersByMerchantId, uploadFile, getFileLink } = require("../utils/functions");
const AI = require("./ai.service");

let onlineUsers = {};  
let onlineOperators = {};  
let userToOperatorMap = {};  

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
            console.log("A Device Connected");

            // بررسی و دریافت SID از کوکی
            const cookies = socket.request.headers.cookie;
            const socketIDCookie = getCookie("cookieToken", cookies);

            // زمانی که کاربر یا اپراتور می‌خواهد وارد چت شود
            socket.on('join', async (data,callback) => {
                const { apiKey, isOperator } = data;
                
                // Check Operator Or User
                if (isOperator) {
                    const operator = await OperatorsModel.findOne({ apikey: apiKey });
                    if (!operator) {
                        return socket.emit('message', 'API Key اپراتور نامعتبر است');
                    }
                    
                    if(!onlineOperators[operator.merchantId]){
                        onlineOperators[operator.merchantId] = {};
                    }

                    // Check Other Online Operator This Merchant
                    if(onlineOperators[operator.merchantId] && Object.values(onlineOperators[operator.merchantId]).length > 0){
                        return callback({success:false,message:"یک اپراتور دیگر متل است"})
                    }else{
                        onlineOperators[operator.merchantId][socket.id] = operator;
                    }
              
  
                    console.log(`Operator ${operator.userName} joined the chat`);
                    
                    // Get User List In Operator Panel
                    socket.emit('updateUserList', Object.values(onlineUsers[operator.merchantId] || []));

                    // Update Operator List Client Widget
                    const users = getUsersByMerchantId(onlineUsers,operator.merchantId);
                    for (const key in users) {
                     this.io.to(key).emit('updateOperatorList', Object.values(onlineOperators[operator.merchantId] || []));
                    }
                    callback({success:true,message:"موفق"})
                } else {
                    // Check User Api Key
                    const user = await UserModel.findOne({ apiKey });
                    if (!user) {
                        return socket.emsit('message', 'API Key نامعتبر است');
                    }

                    // Check Auth User With CookieID
                    if (!socketIDCookie) {
                        socket.emit('requestUserInfo', 'لطفاً نام و ایمیل خود را وارد کنید:');
                        return
                    } else {
                        const details = await verifyUserChatToken(socketIDCookie)
                        
                        //Expire Or No Cookie 
                        if(!details){
                            socket.emit('requestUserInfo', 'لطفاً نام و ایمیل خود را وارد کنید:');
                            return
                        }

                        if (!onlineUsers[user._id]) {
                            onlineUsers[user._id] = {};
                        }
                        onlineUsers[user._id][socket.id] = {
                            name:details.name,
                            email:details.email,
                            id: socket.id ,
                            cookieId:details.sid,
                            merchantId:user._id
                        };
                        
                        console.log(`User ${details.name} joined with email: ${details.email}`);
 
                        // اینجا لیست اپراتور های مرچنت مورد نظر هست فعلا اتوماتیک به اپراتور اول پیام میره
                        const merchantOperators = getOperatorsByMerchantId(onlineOperators,user._id)
                        const opSocketId = Object.keys(merchantOperators)[0]
                        this.io.to(opSocketId).emit('updateUserList', Object.values(onlineUsers[user._id])); 

                        const lastMessages = await getMessageBySid(details.sid);                    
                        if(lastMessages && lastMessages.length>0){
                            socket.emit("loadMessages",lastMessages)
                            socket.emit("updateOperatorList",Object.values(merchantOperators))
                        }else if(!onlineOperators[user._id] || Object.values(onlineOperators[user._id]).length < 1){
                            socket.emit("ready", "offline");
                        }else{
                            socket.emit("updateOperatorList",Object.values(merchantOperators))
                            socket.emit("ready", "welcome");
                        }

                        userToOperatorMap[socket.id] = null;  
                        // console.log(`Using existing socketid: ${socketIDCookie}`);
                        // console.log(onlineUsers)
                    }   
       
                    
       
                }
            });

            // گرفتن ایمیل و نام کاربر جهت ساخت کوکی آی دی
            socket.on('userInfo', async (userData) => {
                const { name, email } = userData;
                if (!name || !email) {
                    return socket.emit('message', 'نام و ایمیل نمی‌تواند خالی باشد');
                }
                const newCookieToken = await generateUserChatToken(name,email,socket.id);
                socket.emit("setCookie",newCookieToken)
            });

            // Disconnect 
            socket.on('disconnect', () => {
                
                // اگراپراتور لفت داد
                let MTIDOPERATOR;
                for (const merchantId in onlineOperators) {
                    for (const socketId in onlineOperators[merchantId]) {
                      MTIDOPERATOR = onlineOperators[merchantId][socketId].merchantId
                      if(socketId === socket.id){
                        delete onlineOperators[merchantId][socket.id]
                      }
                    }
                }   
                const users = getUsersByMerchantId(onlineUsers,MTIDOPERATOR);
                for (const key in users) {
                    this.io.to(key).emit('updateOperatorList', Object.values(onlineOperators[MTIDOPERATOR] || []));
                }
                // this.io.emit('updateOperatorList', Object.values(onlineOperators[MTIDOPERATOR] || []));
                 
                // اگر کلاینت لفت داد
                let MTIDCLIENT;
                for (const merchantId in onlineUsers) {
                    for (const socketId in onlineUsers[merchantId]) {
                      // console.log(onlineOperators[merchantId][socketId])
                      MTIDCLIENT = onlineUsers[merchantId][socketId].merchantId
                      if(socketId === socket.id){
                        delete onlineUsers[merchantId][socket.id]
                      }
                    }
                }
                const operators = getOperatorsByMerchantId(onlineOperators,MTIDCLIENT);
                for (const key in operators) {
                    this.io.to(key).emit('updateUserList', Object.values(onlineUsers[MTIDCLIENT] || []));
                }

            });

            // Send Message From Client To Operator
            socket.on('sendMessageToOperator', async (data) => {
                const details = await verifyUserChatToken(socketIDCookie)
                const user = getUserAndOperatorBySocketID(onlineUsers,socket.id)
                
                // Save Client Message
                // await SaveMessageClient(data,user);
                if(data.ai){
                    await SaveMessageClient(data,user,false)
                    const ai = new AI(user.merchantId)
                    const finall = await ai.respondToMessage(data.message)
                    this.io.to(socket.id).emit('newMessageFromOperator', {
                        type:finall.type,
                        message:finall.message,
                        data:finall.data
                    });
                    await SaveMessageOperator(finall,user,true);
                    
                    // Check For Online Operators
                }else if(data.qs){
                    let qss = [
                        {key:"1",value:"میتونی محصول رو مقایسه کنی؟",qs:"این محصول برای مقایسه است"},
                        {key:"2",value:"ارزونترین محصولتون چیه؟",qs:"این محصول قیمت مناسبی دارد"},
                        {key:"3",value:"چطور میتونم هیکس رو داشته باشم؟",qs:"این لیست محصولات است"},
                    ]
                    await SaveMessageClient(data,user,false)
                    await SaveMessageOperator(data,user,false);
                    this.io.to(socket.id).emit('newMessageFromOperator', {
                        type:"text",
                        message:data.item.key,
                        data:qss
                    });

                    console.log(data)
                    return
                }
               
                if(user && onlineOperators[user.merchantId] && Object.values(onlineOperators?.[user.merchantId]).length > 0){
                    let operatorSocketId = Object.keys(onlineOperators[user.merchantId])[0];
                    this.io.to(operatorSocketId).emit('newMessageFromUser', {
                        type:data.type,
                        socketID:socket.id,
                        message:data.message
                    });
                    await SaveMessageClient(data,user);
                }
   
            });
  
            // Send Message From Operator To Client
            socket.on('sendMessageToUser', async (data) => {
                const targetUser = getUserAndOperatorBySocketID(onlineUsers,data.sid)
                if (targetUser.id) {
                    this.io.to(targetUser.id).emit('newMessageFromOperator', data);
                }
                console.log(data)
                await SaveMessageOperator(data,targetUser,false);
            });

            // Get Last Messages
            socket.on("getMessages", async (data,callback) => {
                
                const messages = await getMessageBySid(data);
                callback(messages)
                // socket.emit("setLastMessages", messages);
            });

            // Get Questions
            socket.on("qusetions", async (data,callback) => {
                const details = await verifyUserChatToken(socketIDCookie);
                let qss = [
                    {key:"1",value:"میتونی محصول رو مقایسه کنی؟",qs:"این محصول برای مقایسه است"},
                    {key:"2",value:"ارزونترین محصولتون چیه؟",qs:"این محصول قیمت مناسبی دارد"},
                    {key:"3",value:"چطور میتونم هیکس رو داشته باشم؟",qs:"این لیست محصولات است"},
                ]
                callback(qss)
            })

            // Send File From Client To Operator
            socket.on("clientSendFile", async (data, callback) => {
                // console.log(data)
                const user = getUserAndOperatorBySocketID(onlineUsers,socket.id)
                let operatorSocketId = Object.keys(onlineOperators[user.merchantId])[0];

                try {
                    // فایل را آپلود می‌کنیم
                    const fileUpload = await uploadFile(data);

                    if(fileUpload){
                        const data = {
                            type:"image",
                            link:fileUpload,
                            fullLink:`${process.env.LIARA_IMAGE_URL}${fileUpload}`,
                            socketID:socket.id
                        }
                        this.io.to(operatorSocketId).emit('newMessageFromUser', data);
                        await SaveMessageClient(data,user);
                        callback({
                            success:true,
                            message:"آپلود با موفقیت انجام شد",
                            fileName:data.fullLink,
                            type:"image"
                        })
                    }else{
                        callback({success:false,message:"خطا در آپلود فایل"})
                    }
                    // const fileLink = await getFileLink(fileUpload)
                    console.log(fileUpload)
                    
                    // if (filelink) {
                    //     console.log("File uploaded successfully:", filelink);
                    //     callback({ success: true, filelink });
                    // } else {
                    //     console.log("File upload failed");
                    //     callback({ success: false, message: "Upload failed" });
                    // }
                } catch (error) {
                    console.log("Error during file upload:", error);
                    // callback({ success: false, message: "Error during upload" });
                }
            });

            // Send File From Operator To User
            socket.on("operatorSendFile", async (data, callback) => {
                // console.log(data)
                const user = getUserAndOperatorBySocketID(onlineUsers,data.socketID)
                // let operatorSocketId = Object.keys(onlineOperators[user.merchantId])[0];
                try {
                    // فایل را آپلود می‌کنیم
                    const fileUpload = await uploadFile(data);

                    if(fileUpload){
                        const data = {
                            type:"image",
                            link:fileUpload,
                            fullLink:`${process.env.LIARA_IMAGE_URL}${fileUpload}`
                        }
                        this.io.to(user.id).emit('newMessageFromOperator',{
                            success:true,
                            message:"آپلود با موفقیت انجام شد",
                            fileName:data.fullLink,
                            type:"image"
                        });
                        await SaveMessageOperator(data,user);
                        callback({
                            success:true,
                            message:"آپلود با موفقیت انجام شد",
                            fileName:data.fullLink,
                            type:"image"
                        })
                    }else{
                        callback({success:false,message:"خطا در آپلود فایل"})
                    }
                    // const fileLink = await getFileLink(fileUpload)
                    console.log(fileUpload)
                    

                } catch (error) {
                    console.log("Error during file upload:", error);
                    // callback({ success: false, message: "Error during upload" });
                }
            });

        });
    }
};
