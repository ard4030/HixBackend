const { Server } = require("socket.io");
const { OperatorsModel } = require("../model/OperatorsModel");
const { UserModel } = require("../model/UserModel");
const { SaveMessageClient, SaveMessageOperator, getMessageBySid } = require("./chat.service");
const { v4: uuidv4 } = require('uuid');
const { getCookie, generateUserChatToken, verifyUserChatToken, getUserAndOperatorBySocketID, getOperatorsByMerchantId, getUsersByMerchantId, uploadFile, getFileLink } = require("../utils/functions");
const AI = require("./ai.service");

class ChatApplication {
    constructor(httpServer, app) {
        this.app = app;
        this.io = new Server(httpServer, this.getSocketOptions());
        
        // تغییر ساختار از Map به Object
        this.onlineUsers = {}; // ذخیره کاربران آنلاین به صورت آبجکت
        this.onlineOperators = {}; // ذخیره اپراتورهای آنلاین به صورت آبجکت
        this.userToOperatorMap = {}; // ذخیره ارتباط کاربران و اپراتورها به صورت آبجکت
        
        this.setSocketListeners();
    }

    getSocketOptions() {
        return {
            cors: {
                origin: ["http://localhost:5500", "http://localhost:3000", "http://127.0.0.1:5500"],
                credentials: true
            },
            transports: ["websocket", "polling"],
            connectionStateRecovery: {
                maxDisconnectionDuration: 2 * 60 * 1000,
                skipMiddlewares: true
            },
            serveClient: true
        };
    }

    setSocketListeners() {
        this.io.on("connection", (socket) => {
            console.log("A Device Connected");

            // بررسی و دریافت SID از کوکی
            const cookies = socket.request.headers.cookie;
            const socketIDCookie = getCookie("cookieToken", cookies);

            socket.on('join', (data, callback) => this.handleJoin(socket, data, callback, socketIDCookie));
            socket.on('userInfo', (userData) => this.handleUserInfo(socket, userData));
            socket.on('disconnect', () => this.handleDisconnect(socket));
            socket.on('sendMessageToOperator', (data) => this.handleSendMessageToOperator(socket, data, socketIDCookie));
            socket.on('sendMessageToUser', (data) => this.handleSendMessageToUser(socket, data));
            socket.on("getMessages", (data, callback) => this.handleGetMessages(data, callback));
            socket.on("qusetions", (data, callback) => this.handleGetQuestions(callback));
            socket.on("clientSendFile", (data, callback) => this.handleClientSendFile(socket, data, callback));
            socket.on("operatorSendFile", (data, callback) => this.handleOperatorSendFile(socket, data, callback));
        });
    }

    async handleJoin(socket, data, callback, socketIDCookie) {
        const { apiKey, isOperator } = data;

        if (isOperator) {
            await this.handleOperatorJoin(socket, apiKey, callback);
        } else {
            await this.handleUserJoin(socket, apiKey, callback, socketIDCookie);
        }
    }

    async handleOperatorJoin(socket, apiKey, callback) {
        const operator = await OperatorsModel.findOne({ apikey: apiKey });
        if (!operator) {
            return socket.emit('message', 'API Key اپراتور نامعتبر است');
        }

        if (!this.onlineOperators[operator.merchantId]) {
            this.onlineOperators[operator.merchantId] = {};
        }

        if (Object.keys(this.onlineOperators[operator.merchantId]).length > 0) {
            return callback({ success: false, message: "یک اپراتور دیگر متصل است" });
        }

        this.onlineOperators[operator.merchantId][socket.id] = operator;
        console.log(`Operator ${operator.userName} joined the chat`);
        socket.emit('updateUserList', Object.values(this.onlineUsers));
        callback({ success: true, message: "موفق" });
    }

    async handleUserJoin(socket, apiKey, callback, socketIDCookie) {
        const user = await UserModel.findOne({ apiKey });
        if (!user) {
            return socket.emit('message', 'API Key نامعتبر است');
        }

        if (!socketIDCookie) {
            socket.emit('requestUserInfo', 'لطفاً نام و ایمیل خود را وارد کنید:');
            return;
        }

        const details = await verifyUserChatToken(socketIDCookie);
        if (!details) {
            socket.emit('requestUserInfo', 'لطفاً نام و ایمیل خود را وارد کنید:');
            return;
        }

        this.onlineUsers[socket.id] = {
            name: details.name,
            email: details.email,
            merchantId: user._id
        };

        console.log(`User ${details.name} joined`);

        const merchantOperators = getOperatorsByMerchantId(this.onlineOperators, user._id);

        // بررسی کنید که merchantOperators یک آبجکت باشد
        if (typeof merchantOperators === "object" && Object.keys(merchantOperators).length > 0) {
            const opSocketId = Object.keys(merchantOperators)[0];
            this.io.to(opSocketId).emit('updateUserList', Object.values(this.onlineUsers));
        } else {
            console.error("merchantOperators باید یک آبجکت باشد");
        }

        const lastMessages = await getMessageBySid(details.sid);
        socket.emit(lastMessages && lastMessages.length > 0 ? "loadMessages" : "ready", lastMessages || "welcome");
        callback({ success: true });
    }

    async handleSendMessageToOperator(socket, data, socketIDCookie) {
        const details = await verifyUserChatToken(socketIDCookie);
        const user = getUserAndOperatorBySocketID(this.onlineUsers, socket.id);

        if (data.ai) {
            await SaveMessageClient(data, user, false);
            const ai = new AI(user.merchantId);
            const response = await ai.respondToMessage(data.message);
            this.io.to(socket.id).emit('newMessageFromOperator', response);
            await SaveMessageOperator(response, user, true);
        } else if (data.qs) {
            const qss = [
                { key: "1", value: "میتونی محصول رو مقایسه کنی؟", qs: "این محصول برای مقایسه است" },
                { key: "2", value: "ارزونترین محصولتون چیه؟", qs: "این محصول قیمت مناسبی دارد" },
                { key: "3", value: "چطور میتونم هیکس رو داشته باشم؟", qs: "این لیست محصولات است" }
            ];
            await SaveMessageClient(data, user, false);
            await SaveMessageOperator(data, user, false);
            this.io.to(socket.id).emit('newMessageFromOperator', { type: "text", message: data.item.key, data: qss });
        } else {
            if (user && this.onlineOperators[user.merchantId] && Object.keys(this.onlineOperators[user.merchantId]).length > 0) {
                const operatorSocketId = Object.keys(this.onlineOperators[user.merchantId])[0];
                const operator = this.onlineOperators[user.merchantId][operatorSocketId];
                this.io.to(operatorSocketId).emit('newMessageFromOperator', data);
                await SaveMessageOperator(data, user, false);
            }
        }
    }

    async handleSendMessageToUser(socket, data) {
        const user = this.onlineUsers[socket.id];
        if (user) {
            await SaveMessageClient(data, user, true);
        }
    }

    async handleGetMessages(data, callback) {
        const lastMessages = await getMessageBySid(data.sid);
        callback(lastMessages);
    }

    async handleGetQuestions(callback) {
        const questions = [
            { key: "1", value: "میتونی محصول رو مقایسه کنی؟", qs: "این محصول برای مقایسه است" },
            { key: "2", value: "ارزونترین محصولتون چیه؟", qs: "این محصول قیمت مناسبی دارد" },
            { key: "3", value: "چطور میتونم هیکس رو داشته باشم؟", qs: "این لیست محصولات است" }
        ];
        callback(questions);
    }

    async handleClientSendFile(socket, data, callback) {
        const { file } = data;
        const fileName = await uploadFile(file);
        const fileLink = getFileLink(fileName);
        this.io.to(socket.id).emit("fileUploaded", { fileLink });
        callback({ success: true, message: 'File uploaded successfully' });
    }

    async handleOperatorSendFile(socket, data, callback) {
        const { file } = data;
        const fileName = await uploadFile(file);
        const fileLink = getFileLink(fileName);
        this.io.to(socket.id).emit("fileUploaded", { fileLink });
        callback({ success: true, message: 'File uploaded successfully' });
    }

    handleDisconnect(socket) {
        delete this.onlineUsers[socket.id];
        Object.keys(this.onlineOperators).forEach((merchantId) => {
            delete this.onlineOperators[merchantId][socket.id];
        });
    }
}

module.exports = ChatApplication;
