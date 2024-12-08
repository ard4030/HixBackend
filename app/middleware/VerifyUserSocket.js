const { OperatorsModel } = require("../model/OperatorsModel");
const { SessionModel } = require("../model/SessionModel");
const { UserModel } = require("../model/UserModel");
const jwt = require("jsonwebtoken");

function getCookie(name,cookies) {
    const value = `; ${cookies}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

const VerifyUserSocket = async (socket, next) => {
    const cookies = socket.handshake.headers.cookie;
    const token = getCookie("authToken",cookies);
    console.log(cookies)

    // CheckSession
    // const isCookie = await SessionModel.findOne({name:hixCookie})
    // if(isCookie){
    //     socket.handshake.sessionId = isCookie._id
    // }else{
    //     const createSession = await SessionModel.create({name:hixCookie})
    //     socket.handshake.sessionId = createSession._id
    //     // console.log("***",createSession)
    // }

    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, async (err, data) => {
            if (err) {
                next();
            }
            
            const user = await UserModel.findOne({ _id: data.username });
            if (user) {
                // ذخیره اطلاعات کاربر در session
                socket.handshake.user = user; // یا هر کلید دیگری که می‌خواهید استفاده کنید
                // await socket.handshake.session.save(); // ذخیره تغییرات در session
            }else{
                const operator = await OperatorsModel.findOne({ _id: data.username })
                socket.handshake.user = operator;
            }
    
           
    
            next(); // ادامه به middleware بعدی
        });
    }else{
        next()
    }


};

module.exports = { VerifyUserSocket };
