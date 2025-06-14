const { Server } = require("socket.io");
const { getCookie, generateUserChatToken, verifyUserChatToken, getUserAndOperatorBySocketID,
     getOperatorsByMerchantId, getUsersByMerchantId, uploadFile, getFileLink, 
     getOperatorBySocketId,
     getLockUser,
     getFreeOperators,
     getLastMessage,
     convertMillisToJalali,
     uploadVoice,
     getPlan} = require("../utils/functions");
const { OperatorsModel } = require("../model/OperatorsModel");
const { UserModel } = require("../model/UserModel");
const { SaveMessageClient, SaveMessageOperator, getMessageBySid } = require("./chat.service");
const AI = require("./ai.service");
const { ChatModel } = require("../model/ChatModel");
const { OptionModel } = require("../model/Option");
const { PreparedMessagesModel } = require("../model/PreparedMessages");
const {PlanModel} = require("../model/PlanModel");
const { AllowedSiteModel } = require("../model/AllowedSiteModel");
const { TelegramBotListener } = require("./TelegramBotManager");
const TelegramBot = require("node-telegram-bot-api");
const fs = require('fs');
const path = require('path');


// SendToTelegram Test
// const token = '7932459058:AAGzc4BvtCir4DBW7BUFhnEvQCdk8kam0XI';
// const bot = new TelegramBot(token, { polling: true });

// bot.on('message', (msg) => {
//     console.log('پیامی از کاربر دریافت شد:', msg.text);
//     console.log(msg.chat.id)
//     // bot.sendMessage(msg.chat.id, 'پیامت رسید ✅');
// });

class ChatApplication {
    constructor(httpServer, app,botClass) {
        this.app = app;
        this.io = new Server(httpServer, this.getSocketOptions());
        
        // تغییر ساختار از Map به Object
        this.onlineUsers = {}; // ذخیره کاربران آنلاین به صورت آبجکت
        this.onlineOperators = {}; // ذخیره اپراتورهای آنلاین به صورت آبجکت
        this.userToOperatorMap = {}; // ذخیره ارتباط کاربران و اپراتورها به صورت آبجکت
        this.verifiedBots = {}; //ربات هایی که وریفای میشن

        this.TBL = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
        this.InitialBots()

        this.setSocketListeners();

        // check timing Message
        setInterval(() => {
            this.checkMessageTime()
        }, 60 * 1000); // 60,000ms = 1 دقیقه
    }

    // Initial Telegram Bots
    async InitialBots(){

        // 1. خوندن فایل (اگر خالی بود، مقدار پیش‌فرض می‌ذاریم)
        const filePath = path.join(__dirname, 'bots.json'); // اگر فایل کنار chat.js هست

        let rawData = fs.readFileSync(filePath, 'utf-8').trim();
        this.verifiedBots = rawData ? JSON.parse(rawData) : {};
        
        
        this.TBL.on('message', async (msg) => {
            const chatId = msg.chat.id;
            const text = msg.text;

            if(this.verifiedBots[chatId]){
                await this.sendMessageTelegramToUser(msg,chatId)
            }else if(!this.verifiedBots[chatId] && text.includes("code")){
                const operator = await OperatorsModel.findOne({telegramCode:text});

                if(operator){
                    console.log(operator)
                    if (!this.verifiedBots[chatId]) {
                        this.verifiedBots[chatId] = {};
                    }
                    this.verifiedBots[chatId]['userName'] = operator.userName;
                    this.verifiedBots[chatId]['_id'] = operator._id;
                    this.verifiedBots[chatId]['merchantId'] = operator.merchantId;
                    const jsonData = JSON.stringify(this.verifiedBots);
                    fs.writeFileSync(filePath, jsonData);
                    this.TBL.sendMessage(chatId,",وریفای موفق ادامه بدید")
                }else{
                    this.TBL.sendMessage(chatId,".کد شما صحیح نیست")
                }
            }else{
                this.TBL.sendMessage(chatId,"مثال :code_f4418098-fa4f-457e-8c8f-587a0a90a4b6 لطفا کد وریفای خود را وارد کنید")
            }    
        });

        this.TBL.on("callback_query", async (query) => {

            if (query.data.startsWith('accept_chat_')) {

                // Accept Operator Chat
                const operatorTelegramId = query.from.id;
                const userSocketId = query.data.substring(12);
                const chatId = query.message.from.id;
                const user = getUserAndOperatorBySocketID(this.onlineUsers,userSocketId);

                if(user){
                    // Lock User From Operator
                    if(this.onlineUsers[user.merchantId][userSocketId]["targetTelegramOperator"] === operatorTelegramId){
                        this.TBL.sendMessage(operatorTelegramId,`قبلا چت رو پذیرفتید`, {})
                    }else if (this.onlineUsers[user.merchantId][userSocketId]["targetTelegramOperator"] === undefined){
                        this.onlineUsers[user.merchantId][userSocketId]["targetTelegramOperator"] = operatorTelegramId;
                        this.TBL.sendMessage(operatorTelegramId, `🟢 چت با کاربر (SID_${userSocketId}) پذیرفته شد.\n\n🖊️ لطفاً پاسخ خود را تایپ کنید:`,
                            {
                                // reply_to_message_id: query.message.message_id,
                                // reply_markup: {
                                //     force_reply: true
                                // }
                            })

                        const chatIDS = Object.keys(this.verifiedBots).map(item => {
                            if(item !== operatorTelegramId) return item
                        });
                        console.log("chatIDS" ,chatIDS)
                        try {
                            const sendPromises = chatIDS.map(item =>
                                this.TBL.sendMessage(item,`کاربر با نام ${user?.name} و سوکت ایدی SID_${user?.id} به اپراتور ${this.verifiedBots?.[operatorTelegramId]?.userName} متصل شد`,{
                                    reply_to_message_id : query.message.message_id,
                                    reply_markup : {
                                        force_reply : true
                                    }
                                })
                                // fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                                //     method: 'POST',
                                //     headers: { 'Content-Type': 'application/json' },
                                //     body: JSON.stringify({
                                //         chat_id: item,
                                //         text: `
                                //         کاربر با نام
                                //         ${user.name}
                                //         و سوکت آی دی 
                                //         SID_${user.id}
                                //         به اپراتور
                                //     ${this.verifiedBots[operatorTelegramId].userName}
                                               

                                //         `,
                                //     }),
                                // })
                            );

                            await Promise.all(sendPromises); // منتظر بمان تا همه اجرا شوند
                            return true
                        } catch (error) {
                            return false
                            console.error("Error sending message:", error.message);
                        }


                    }else{
                        
                        this.TBL.sendMessage(operatorTelegramId,'اپراتور دیگری در حال پاسخگویی به این کاربر است')
                    }
                }


            }



        })


    }


    // Set Socket Options
    getSocketOptions() {
        
        let allsites = [];
        // AllowedSiteModel.find({ isActive: true })  // فقط سایت‌های فعال را انتخاب می‌کنیم
        // .then(sites => {
        //     allsites = sites.map(site => site.url);  // استخراج URL سایت‌های مجاز
        // })
        // .catch(err => {
        //     allsites = [];
        // });
        return {
            cors: {
                // origin: [
                //     "http://localhost:5500",
                //     "http://localhost:3000",
                //     "http://localhost:3001",
                //     "http://127.0.0.1:5500",
                //     "http://127.0.0.1:5502",
                //     "https://hix-operator.vercel.app",
                //     "https://hixnew.liara.run",
                //     "http://localhost:5173",
                //     "https://hix-operator-6h2z.vercel.app",
                //     "http://localhost:5502"
                // ],
                // origin: allsites,
                origin: "*",
                // credentials: true
            },
            transports: ["websocket", "polling"],
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000,
                skipMiddlewares: true
            },
            serveClient: true,
            maxHttpBufferSize: 1e8
        };
    }

    // Socket Listener
    setSocketListeners() {
        this.io.on("connection", (socket) => {
            console.log("A Device Connected");

            // // بررسی و دریافت SID از کوکی
            // const cookies = socket.request.headers.cookie;
            // const socketIDCookie = getCookie("cookieToken", cookies);
            // const socketIDCookie = socket.handshake.auth.cookieId;
            // console.log(socketIDCookie)
            socket.on('setting',(data, callback) => this.settings(socket, data, callback))
            socket.on('join', (data, callback) => this.handleJoin(socket, data, callback));
            socket.on('userInfo', (userData,callback) => this.handleUserInfo(socket, userData,callback));
            socket.on('closeChat', (userData,callback) => this.handleCloseChat(socket, userData,callback));
            socket.on('disconnect', () => this.handleDisconnect(socket));
            socket.on('disconnectOperator', () => this.handleDisconnect(socket))
            socket.on('sendMessageToOperator', (data,callback) => this.handleSendMessageToOperator(socket, data , callback));
            socket.on('sendMessageToAI', (data,callback) => this.handleSendMessageToAI(socket, data , callback));
            socket.on('sendMessageToUser', (data,callback) => this.handleSendMessageToUser(socket, data,callback));
            socket.on("getMessages", (data, callback) => this.handleGetMessages(data, callback,socket));
            socket.on("qusetions", (data, callback) => this.handleGetQuestions(callback,data,socket));
            socket.on("clientSendFile", (data, callback) => this.handleClientSendFile(socket, data, callback));
            socket.on("operatorSendFile", (data, callback) => this.handleOperatorSendFile(socket, data, callback));
            socket.on('isTyping', (data) => this.handleIsTyping(socket, data));
        });
    }

    // ChangeLock
    checkMessageTime(){
        const THREE_MINUTES = 1 * 60 * 1000; // 180000 میلی‌ثانیه
        console.log("Ckecking")
        for (const merchantId in this.onlineUsers) {
            const users = this.onlineUsers[merchantId];
        
            for (const userId in users) {
                const user = users[userId];

                const userTime = user.lastMessageTime;
                const operatorTime = user.lastMessageOperatorTime;


                if(userTime){

                    // این شرط میگه که اخرین پیام کاربر داده
                    if(operatorTime < userTime || !operatorTime){
                        if(this.onlineUsers[merchantId][userId]["targetOperator"]){
                            const now = Date.now();
                            if(now - userTime > THREE_MINUTES){
                                this.onlineUsers[merchantId][userId]["targetOperator"]=null;
                                this.onlineUsers[merchantId][userId]["opName"]=null;
                                this.onlineUsers[merchantId][userId]["opId"]=null;
            
                                const operators = getOperatorsByMerchantId(this.onlineOperators,merchantId);
    
                                for (const key in operators) {
                                    this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[merchantId] || []));
                                    // this.io.to(key).emit('messageSound', user);
                                }
                            }
                        }
                    }

                }
                // else if(userTime){
                //     // اگه اپراتور قفل کرده بود و پیام نداده بود
                //     const now = Date.now();
                //     if(now - userTime > THREE_MINUTES){
                //         this.onlineUsers[merchantId][userId]["targetOperator"]=null;
                //         this.onlineUsers[merchantId][userId]["opName"]=null;
                //         this.onlineUsers[merchantId][userId]["opId"]=null;
    
                //         const operators = getOperatorsByMerchantId(this.onlineOperators,merchantId);

                //         for (const key in operators) {
                //             this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[merchantId] || []));
                //             // this.io.to(key).emit('messageSound', user);
                //         }
                //     }
                // }
            }
        }
    }

    // Get Setting
    async settings(socket, data, callback){
        const { apiKey } = data;
        const user = await UserModel.findOne({ apiKey });
        if (!user) {
            callback({success:false,code:0,message:'API Key نامعتبر است'})
            return
        }

        const options = await OptionModel.findOne({merchantId:user._id}) 
        callback({ success:true , data:options.options })
    }
    
    // Handle Join Operator Or User Or Client
    async handleJoin(socket, data, callback) {
        const { apiKey, isOperator , cookieId } = data;

        if (isOperator) {
            await this.handleOperatorJoin(socket, apiKey, callback);
        } else {
            await this.handleUserJoin(socket, apiKey, callback , cookieId);
        }
    }

    // Handle Operator Join
    async handleOperatorJoin(socket, apiKey, callback) {
        
        let operator = await OperatorsModel.findOne({ apikey: apiKey });
        if (!operator) {
            callback({
                success:false,
                message:'API Key اپراتور نامعتبر است'
            })
            return
            // return socket.emit('message', 'API Key اپراتور نامعتبر است');
        }
        
        if(!this.onlineOperators[operator?.merchantId]){
            this.onlineOperators[operator?.merchantId] = {};
        }

        // Check Other Online Operator This Merchant
        // if(this.onlineOperators[operator.merchantId] && Object.values(this.onlineOperators[operator.merchantId]).length > 0){
        //     return callback({success:false,message:"یک اپراتور دیگر متل است"})
        // }else{
        //     this.onlineOperators[operator.merchantId][socket.id] = operator;
        // }
        this.onlineOperators[operator.merchantId][socket.id] = operator;
  
        console.log(`Operator ${operator.userName} joined the chat`);
        
        // Get User List In Operator Panel
        socket.emit('updateUserList', Object.values(this.onlineUsers[operator.merchantId] || []));

        // Update Operator List Client Widget
        const users = getUsersByMerchantId(this.onlineUsers,operator.merchantId);
        for (const key in users) {
         this.io.to(key).emit('updateOperatorList', Object.values(this.onlineOperators[operator.merchantId] || []));
        }
        callback({success:true,message:"موفق",socketId:socket.id})
        return
    }

    // Handle Client Join
    async handleUserJoin(socket, apiKey, callback, cookieId) {
        // Check User Api Key
        const user = await UserModel.findOne({ apiKey });
        // console.log(apiKey)
        if (!user) {
            callback({code:0,message:'API Key نامعتبر است'})
            return
        }
        
        const options = await OptionModel.findOne({merchantId:user._id}) 

        // Check Auth User With CookieID
        if (!cookieId) {
            callback({
                code:1,
                showform:options?.options?.showform,
                fields:options?.options?.fields
            })
            return
        } else {
            const details = await verifyUserChatToken(cookieId);

            //Expire Or No Cookie 
            if(!details){
                callback({
                    code:1,
                    showform:options?.options?.showform,
                    fields:options?.options?.fields
                })
                return
            }

            if (!this.onlineUsers[user?._id]) {
                this.onlineUsers[user._id] = {};
            }

            this.onlineUsers[user._id][socket.id] = {
                userData:details.userData,
                name:details.userData?.name?details.userData?.name:"مهمان",
                id: socket.id ,
                cookieId:details.sid,
                merchantId:user._id,
                targetOperator:null,
                opName:null,
                opId:null
            };

            // Get Last Message
            const messages = await ChatModel.findOne({sid:details.sid});
            if(messages){
                const lastMessage = getLastMessage(messages.messages[messages.messages.length-1]);
                this.onlineUsers[user._id][socket.id]['lastMessage']= lastMessage.msg;
                this.onlineUsers[user._id][socket.id]['lastDate']= lastMessage.date;
                this.onlineUsers[user._id][socket.id]['lastMessageSeen']= false
            }
            
            console.log(`User ${details.name?details.name:"مهمان"} joined`);

            // اینجا لیست اپراتور های مرچنت مورد نظر هست فعلا اتوماتیک به اپراتور اول پیام میره
            const merchantOperators = getOperatorsByMerchantId(this.onlineOperators,user._id)
            const opSocketId = Object.keys(merchantOperators)[0]
            this.io.to(opSocketId).emit('updateUserList', Object.values(this.onlineUsers[user._id])); 

            // Get Questions
            const client = getUserAndOperatorBySocketID(this.onlineUsers,socket.id);
            const questions = await PreparedMessagesModel.find({merchantId:client.merchantId})

            

            // دریافت پیام های قبلی
            const lastMessages = await getMessageBySid(details.sid);
            if(!this.onlineOperators[user._id] || Object.values(this.onlineOperators[user._id]).length < 1){
                // کد دو یعنی اپراتوری در حال حاضر آنلاین نیست
                callback({
                    code:2,
                    message:"Operators is Offline!",
                    data:lastMessages,
                    user:details,
                    questions
                })
                
            }else{
                socket.emit("updateOperatorList",Object.values(merchantOperators))
                // کد 3 یعنی اپراتور آنلاینه
                callback({
                    code:3,
                    message:"Ready",
                    data:lastMessages,
                    user:details,
                    questions
                })
                
            }
            this.userToOperatorMap[socket.id] = null;  
        }   
    }

    // Handle Verification Client And Set Cookie Token
    async handleUserInfo(socket, userData , callback){

        const newCookieToken = await generateUserChatToken(userData,socket.id);
        callback({success:true,token:newCookieToken})
    }

    // Handle Disconnect Operator Or Client
    async handleDisconnect(socket){
              
        // اگراپراتور لفت داد
        let MTIDOPERATOR;
        for (const merchantId in this.onlineOperators) {
            for (const socketId in this.onlineOperators[merchantId]) {
                MTIDOPERATOR = this.onlineOperators[merchantId][socketId].merchantId
                if(socketId === socket.id){
                delete this.onlineOperators[merchantId][socket.id]
                }
            }
        }   
        const users = getUsersByMerchantId(this.onlineUsers,MTIDOPERATOR);
        for (const key in users) {
            // Unlock User this operator
            // if(this.onlineUsers[MTIDOPERATOR][key]["targetOperator"] === socket.id){
            //     this.onlineUsers[MTIDOPERATOR][key]["targetOperator"] = null;
            //     this.onlineUsers[MTIDOPERATOR][key]["opName"] = null;
            //     this.onlineUsers[MTIDOPERATOR][key]["opId"] = null
            // }

            // Update Operator list to Client
            this.io.to(key).emit('updateOperatorList', Object.values(this.onlineOperators[MTIDOPERATOR] || []));
        }
   
            
        // اگر کلاینت لفت داد
        let MTIDCLIENT;
        for (const merchantId in this.onlineUsers) {
            for (const socketId in this.onlineUsers[merchantId]) {
                // console.log(onlineOperators[merchantId][socketId])
                MTIDCLIENT = this.onlineUsers[merchantId][socketId].merchantId
                if(socketId === socket.id){
                delete this.onlineUsers[merchantId][socket.id]
                }
            }
        }
        const operators = getOperatorsByMerchantId(this.onlineOperators,MTIDCLIENT);
        for (const key in operators) {
            this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[MTIDCLIENT] || []));
        }

    }

    // Handle Send Message To AI
    async handleSendMessageToAI(socket, data , callback){
        const details = await verifyUserChatToken(data.cookieId)
        const user = getUserAndOperatorBySocketID(this.onlineUsers,socket.id)

        data.time = Date.now();
        data.fullTime = convertMillisToJalali(data.time)

        await SaveMessageClient(data,user,false)

        callback({success:true,message:"send",message:data})

        // Check Ai Plan
        // const plan = await PlanModel.findOne({_id:user.planId})

        // Check Ai True In Plan

        const plan = await getPlan(user.merchantId)
        if(plan.intelligentInteractionWithUsers){
            const ai = new AI(user.merchantId)
            let finall = await ai.respondToMessage(data.message);
            console.log(finall)
            if(finall.success){
                finall.fullTime = convertMillisToJalali(data.time);
                await SaveMessageOperator(finall,user,true);
                this.io.to(socket.id).emit('newMessageFromOperator', {
                    type:finall.type,
                    message:finall.message,
                    data:finall.data,
                    fullTime:data.fullTime,
                    sender:"ai"
                });
            }
        }


    }

    async sendMessageToTelegram(user,details,data){
        // const merchantOperators = this.onlineOperators[user.merchantId];
        // console.log("User ",user)
        // console.log("Details ",details)
        // console.log("Data ", data )
        let chatId = null;
        for (const key in this.verifiedBots) {
            if(String(this.verifiedBots[key].merchantId) === String(user.merchantId)){
                chatId=key;
                break;
            }
        }  

        try {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: `
                    کاربر::${user.name}\nبا سوکت زیر
                    SID_${user.id}
                    
                    ${data.message}
                    `,
                }),
            });
            
        } catch (error) {
            console.log(error.message)
        }
    }

    async sendMessageToTelegramAllOperators(user, data, chatIDS) {

        let inline_keyboard = [];
        // Check Lock Operators
        const targetTelegramOperator = this.onlineUsers[user.merchantId][data.id]?.["targetTelegramOperator"] || null;
        if(targetTelegramOperator){

        }else{
            inline_keyboard = [
                [
                    {
                        text: '✅ قبول چت',
                        callback_data: `accept_chat_${user.id}`
                    }
                ]
            ];
        }



        try {
            const sendPromises = chatIDS.map(item =>
                fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: item,
                        text: `کاربر: ${user.name}\nبا سوکت زیر:\nSID_${user.id}\n${data.message}`,
                        reply_markup: {
                        inline_keyboard:inline_keyboard
                    }
                    }),
                })
            );

            await Promise.all(sendPromises); // منتظر بمان تا همه اجرا شوند
            return true
        } catch (error) {
            return false
            console.error("Error sending message:", error.message);
        }
    }

    async sendMessageTelegramToUser(msg,chatId){
 
        console.log(`[${this.verifiedBots[chatId].userName}] پیام دریافت شد از ${chatId}: ${msg.text}`);  

        if(msg.reply_to_message){
            const match = msg.reply_to_message.text.match(/SID_+([^\s]+)/);
            const socketID = match ? match[1] : null;

            const targetUser = getUserAndOperatorBySocketID(this.onlineUsers,socketID)
            const targetTelegram = targetUser?.["targetTelegramOperator"] || null;
            console.log("targetTelegram" , targetTelegram)
            if(targetTelegram && targetTelegram !== chatId){
                   this.TBL.sendMessage(chatId,"عوضی این اپراتور با کس دیگه ای حرف میزنه")
                   return  
            }


            if(targetUser){
                let data={
                    message:msg.text,
                    content:msg.text,
                    type:"text",
                    sender: 'operator',
                    cookieId:socketID,
                    sid:socketID
                };
                if (socketID) {
                    data.time = Date.now();
                    data.fullTime = convertMillisToJalali(data.time)
                    this.io.to(socketID).emit('newMessageFromOperator', data);
    
                    
    
                    // SaveMessage
                    await SaveMessageOperator(data,targetUser,false);
    
                    // Set Last Message
                    this.onlineUsers[targetUser.merchantId][data.sid]['lastMessage']= data?.message;
                    this.onlineUsers[targetUser.merchantId][data.sid]['lastMessageSeen']= true
    
                    // Update Users List
                    const operators = getOperatorsByMerchantId(this.onlineOperators,targetUser.merchantId);
                    for (const key in operators) {
                        this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[targetUser.merchantId] || []));
                    }
    
                }
                // console.log(socketID)
            }else{
                this.TBL.sendMessage(chatId,"لطفا روی مسیج کاربر مورد نظر ریپلای کن")  
            }

        }else{
            this.TBL.sendMessage(chatId,"لطفا روی مسیج کاربر مورد نظر ریپلای کن")  
        }

        
        // all {
        //     sid: 'EXylmZEFl2K7CdbKAAAH',
        //     message: 'asdas',
        //     content: 'asdas',
        //     apiKey: 'XUv61HbNQJg6y4bWeqwX9dx03Ur10b0O',
        //     cookieId: 'VMtI-VD0ocRRlxF5AAAZ',
        //     type: 'text',
        //     data: [],
        //     link: '',
        //     sender: 'operator'
        // }
    }

    // Handle Send Message From Client To Operator
    async handleSendMessageToOperator(socket, data , callback){
        const details = await verifyUserChatToken(data.cookieId)
        const user = getUserAndOperatorBySocketID(this.onlineUsers,socket.id)

        if(data.qs){
                data.time = Date.now();
                data.fullTime = convertMillisToJalali(data.time)
                await SaveMessageClient(data,user,false)
                await SaveMessageOperator(data,user,false);
                // this.io.to(socket.id).emit('newMessageFromOperator', {
                //     type:"text",
                //     message:data.item.key,
                //     fullTime:data.fullTime
                // });

                this.onlineUsers[user.merchantId][user.id]['lastMessage']= data.message
                // if(this.onlineUsers[user.merchantId][user.id]['targetOperator']===)
                this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= true
                const operators = getOperatorsByMerchantId(this.onlineOperators,user.merchantId);
                for (const key in operators) {
                    this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[user.merchantId] || []));
                    this.io.to(key).emit('messageSound', user);
                }

                callback({
                    success:true,
                    message:"send",
                    data:data
                })
    
                return
        }
       
        // Check exist Operators
        if(user && this.onlineOperators[user.merchantId] && Object.values(this.onlineOperators?.[user.merchantId]).length > 0){
            
            // Check target Operator 
            if(user.targetOperator && this.onlineOperators[user.merchantId][user.targetOperator]){
                data.time = Date.now();
                data.fullTime = convertMillisToJalali(data.time)

                this.io.to(user.targetOperator).emit('newMessageFromUser', {
                    type:data.type,
                    socketID:socket.id,
                    message:data.message,
                    fullTime:data.fullTime
                });
                
                const message = await SaveMessageClient(data,user);

                // Set Last Message User List
                this.onlineUsers[user.merchantId][user.id]['lastMessage']= data.message
                this.onlineUsers[user.merchantId][user.id]['lastMessageTime']= Date.now();
                // if(this.onlineUsers[user.merchantId][user.id]['targetOperator']===)
                this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= true
                const operators = getOperatorsByMerchantId(this.onlineOperators,user.merchantId);
                for (const key in operators) {
                    this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[user.merchantId] || []));
                    this.io.to(key).emit('messageSound', user);
                }

                // Send Telegram
                const OnTelegram = true;
                if(OnTelegram){
                    await this.sendMessageToTelegram(user,details,data)
                }

                callback({
                    success:true,
                    message:"send",
                    message:data
                })

            }else{
                const freeFirstOperator = getFreeOperators(this.onlineOperators,this.onlineUsers,user.merchantId)
                data.time = Date.now();
                data.fullTime = convertMillisToJalali(data.time)
                
                this.io.to(freeFirstOperator).emit('newMessageFromUser', {
                    type:data.type,
                    socketID:socket.id,
                    message:data.message,
                    fullTime:data.fullTime
                });
                
                await SaveMessageClient(data,user);

                // Set Last Message User List
                this.onlineUsers[user.merchantId][user.id]['lastMessage']= data.message;
                this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= false;
                this.onlineUsers[user.merchantId][user.id]['lastMessageTime']= Date.now();
                const operators = getOperatorsByMerchantId(this.onlineOperators,user.merchantId);
                for (const key in operators) {
                    this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[user.merchantId] || []));
                    this.io.to(key).emit('messageSound', user);
                }
                
                // Send Telegram
                const OnTelegram = true;
                if(OnTelegram){
                    await this.sendMessageToTelegram(user,details,data)
                }

                callback({
                    success:true,
                    message:"send",
                    message:data
                })
            }

        }else{

            // Save Message
            data.time = Date.now();
            data.fullTime = convertMillisToJalali(data.time)
            await SaveMessageClient(data,user);

            // Set Last Message User List
            this.onlineUsers[user.merchantId][user.id]['lastMessage']= data.message
            this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= false
            this.onlineUsers[user.merchantId][user.id]['lastMessageTime']= Date.now();

            callback({
                    success:true,
                    message:"send",
                    message:data
            })

            // Send Telegram
            const OnTelegram = true;
            if(OnTelegram){    
                const filePath = path.join(__dirname, 'bots.json'); 
                let rawData = fs.readFileSync(filePath, 'utf-8').trim();
                this.verifiedBots = rawData ? JSON.parse(rawData) : {};
                await this.sendMessageToTelegramAllOperators(user,data,Object.keys(this.verifiedBots))

            }

            
            // this.handleSendMessageToAI(socket, data , callback)
        }

    }

    // Handle Send Message From Operator To Client
    async handleSendMessageToUser(socket, data,callback){
        // console.log("all",data)
        const targetUser = getUserAndOperatorBySocketID(this.onlineUsers,data.sid)
        // console.log("Target User ",targetUser)
        if (targetUser.id) {
            data.time = Date.now();
            data.fullTime = convertMillisToJalali(data.time)
            this.io.to(targetUser.id).emit('newMessageFromOperator', data);
            callback({success:true,message:data})
        }
        try {
            data.time = Date.now();
            data.fullTime = convertMillisToJalali(data.time)

            await SaveMessageOperator(data,targetUser,false);
            // Set Last Message
            this.onlineUsers[targetUser.merchantId][data.sid]['lastMessage']= data?.message;
            this.onlineUsers[targetUser.merchantId][data.sid]['lastMessageSeen']= true;
            this.onlineUsers[targetUser.merchantId][data.sid]['lastMessageOperatorTime']= Date.now();

            // Update Users List
            const operators = getOperatorsByMerchantId(this.onlineOperators,targetUser.merchantId);
            for (const key in operators) {
                this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[targetUser.merchantId] || []));
            }
            callback({success:true,message:data})
        } catch (error) {
            callback({success:false,message:error.message})
        }
    }

    // Get Last Messages
    async handleGetMessages(data, callback , socket){  
        const messages = await getMessageBySid(data.cookieId);
        
        // Get Operator by socket ID
        const operator = getOperatorBySocketId(this.onlineOperators,socket.id)

        // Get User by SocketId
        const client = getUserAndOperatorBySocketID(this.onlineUsers,data.id);

        if (!client) return

        // Check Locked User From Other Operator
        if(client?.targetOperator && client?.targetOperator !== socket.id){
            callback({
                success:false,
                message:"اپراتور دیگری در حال پاسخگویی میباشد"
            })
            return
        }

        // Check Prev Lock And remove
        // const lastUserLock = getLockUser(this.onlineUsers,socket.id);
        // if(lastUserLock){
        //     this.onlineUsers[lastUserLock.merchantId][lastUserLock.id]["targetOperator"] = null;
        //     this.onlineUsers[lastUserLock.merchantId][lastUserLock.id]["opName"] = null;
        //     this.onlineUsers[lastUserLock.merchantId][lastUserLock.id]["opId"] = null;
        // }

        // Lock User To Message Operator
        this.onlineUsers[client.merchantId][data.id]["targetOperator"] = socket.id;
        this.onlineUsers[client.merchantId][data.id]["opName"] = operator.firstName;
        this.onlineUsers[client.merchantId][data.id]["opId"] = operator._id;
        this.onlineUsers[client.merchantId][data.id]["lastMessageSeen"] = true;

        // Refresh UserLists For Online Operators
        const operators = getOperatorsByMerchantId(this.onlineOperators,client.merchantId);
        for (const key in operators) {
            this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[client.merchantId] || []));
        }
        callback({
            success:true,
            data:messages
        })
        return
    }

    // Close Chat
    async handleCloseChat(socket,data, callback){
        // const operatorSocketId = socket.id;
        const userSocketId = data.sid;
        const client = getUserAndOperatorBySocketID(this.onlineUsers,userSocketId);

        this.onlineUsers[client.merchantId][client.id]["targetOperator"] = null;
        this.onlineUsers[client.merchantId][client.id]["opName"] = null;
        this.onlineUsers[client.merchantId][client.id]["opId"] = null;

        // Refresh UserLists For Online Operators
        const operators = getOperatorsByMerchantId(this.onlineOperators,client.merchantId);
        for (const key in operators) {
            this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[client.merchantId] || []));
        }
        callback({
            success:true,
        })
        return

        
    }

    // Get Questions 
    async handleGetQuestions(callback,data,socket){
        const client = getUserAndOperatorBySocketID(this.onlineUsers,socket.id);
        const questions = await PreparedMessagesModel.find({merchantId:client.merchantId})

        callback(questions)
    }

    // Send File From Client To Operator
    async handleClientSendFile(socket, data, callback){

        const user = getUserAndOperatorBySocketID(this.onlineUsers,socket.id);
        if(!user) callback({success:false,message:"خطای سیستمی"})
            
        // let operatorSocketId = Object.keys(this.onlineOperators[user.merchantId]).length > 0 ? Object.keys(this.onlineOperators[user.merchantId])[0]:null;
        try {
            
            // فایل را آپلود می‌کنیم
            const fileUpload = await uploadFile(data);
            // console.log(data)

            if(fileUpload){
                let datanew = {
                    type:data.type,
                    link:fileUpload,
                    fullLink:`${process.env.LIARA_IMAGE_URL}${fileUpload}`,
                    socketID:socket.id,
                    fileName:data.name
                }
                datanew.time = Date.now();
                datanew.fullTime = convertMillisToJalali(data.time)

                this.io.to(user.targetOperator).emit('newMessageFromUser', datanew);
                await SaveMessageClient(datanew,user);

                // Check target Operator 
                if(user.targetOperator && this.onlineOperators[user.merchantId][user.targetOperator]){

                    // Set Last Message User List
                    this.onlineUsers[user.merchantId][user.id]['lastMessage']= "فایل"
                    // if(this.onlineUsers[user.merchantId][user.id]['targetOperator']===)
                    this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= true
                    const operators = getOperatorsByMerchantId(this.onlineOperators,user.merchantId);
                    for (const key in operators) {
                        this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[user.merchantId] || []));
                        this.io.to(key).emit('messageSound', user);
                    }

                }else{
                    // Set Last Message User List
                    this.onlineUsers[user.merchantId][user.id]['lastMessage']= "فایل"
                    this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= false
                    const operators = getOperatorsByMerchantId(this.onlineOperators,user.merchantId);
                    for (const key in operators) {
                        this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[user.merchantId] || []));
                        this.io.to(key).emit('messageSound', user);
                    }
                }

                callback({
                    success:true,
                    message:"آپلود با موفقیت انجام شد",
                    fileName:datanew.fileName,
                    fullLink:datanew.fullLink,
                    type:data.type,
                    fullTime:datanew.fullTime
                })
            }else{
                callback({success:false,message:"خطا در آپلود فایل"})
            }

        } catch (error) {
            console.log("Error during file upload:", error);
            // callback({ success: false, message: "Error during upload" });
        }
    }

    // Send File From Operator To Client
    async handleOperatorSendFile(socket, data, callback){
        
        const user = getUserAndOperatorBySocketID(this.onlineUsers,data.socketID)
        // let operatorSocketId = Object.keys(onlineOperators[user.merchantId])[0];
        try {
            // فایل را آپلود می‌کنیم
            const fileUpload = await uploadFile(data);

            if(fileUpload){
                let datanew = {
                    type:data.type,
                    link:fileUpload,
                    fullLink:`${process.env.LIARA_IMAGE_URL}${fileUpload}`,
                    fileName:data.name
                }
                datanew.time = Date.now();
                datanew.fullTime = convertMillisToJalali(data.time)

                this.io.to(user.id).emit('newMessageFromOperator',{
                    success:true,
                    message:"آپلود با موفقیت انجام شد",
                    fileName:datanew.fileName,
                    type:data.type,
                    fullLink:datanew.fullLink,
                    fullTime:datanew.fullTime
                });
                await SaveMessageOperator(datanew,user);

                // Check target Operator 
                if(user.targetOperator && this.onlineOperators[user.merchantId][user.targetOperator]){

                    // Set Last Message User List
                    this.onlineUsers[user.merchantId][user.id]['lastMessage']= "فایل"
                    // if(this.onlineUsers[user.merchantId][user.id]['targetOperator']===)
                    this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= true
                    const operators = getOperatorsByMerchantId(this.onlineOperators,user.merchantId);
                    for (const key in operators) {
                        this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[user.merchantId] || []));
                        this.io.to(key).emit('messageSound', user);
                    }

                }else{
                    // Set Last Message User List
                    this.onlineUsers[user.merchantId][user.id]['lastMessage']= "فایل"
                    this.onlineUsers[user.merchantId][user.id]['lastMessageSeen']= false
                    const operators = getOperatorsByMerchantId(this.onlineOperators,user.merchantId);
                    for (const key in operators) {
                        this.io.to(key).emit('updateUserList', Object.values(this.onlineUsers[user.merchantId] || []));
                        this.io.to(key).emit('messageSound', user);
                    }
                }

                callback({
                    success:true,
                    message:"آپلود با موفقیت انجام شد",
                    fileName:datanew.fileName,
                    type:data.type,
                    fullTime:datanew.fullTime,
                    fullLink:datanew.fullLink,
                })
            }else{
                callback({success:false,message:"خطا در آپلود فایل"})
            }
            // const fileLink = await getFileLink(fileUpload)

        } catch (error) {
            console.log("Error during file upload:", error);
            // callback({ success: false, message: "Error during upload" });
        }
    }

    async handleIsTyping(socket, data){
        const { isTyping, userType,socketID } = data; // isTyping (true/false), userType ('user' or 'operator')

        let user;
        if(userType === "operator"){
            this.io.to(socketID).emit('isTyping', { isTyping });
        }else{
            user = getUserAndOperatorBySocketID(this.onlineUsers,socket.id)
            if(this.onlineOperators[user?.merchantId]){
                let operatorSocketId = Object.keys(this.onlineOperators[user.merchantId])[0];
                this.io.to(operatorSocketId).emit('isTyping', { isTyping,socketID:socket.id });
                // user = getUserAndOperatorBySocketID(this.onlineUsers, socket.id);
            }
        }

    }

}

module.exports = ChatApplication