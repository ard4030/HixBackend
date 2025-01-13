const {OperatorsModel} = require("../model/OperatorsModel");
const { UserModel } = require("../model/UserModel");
const { UNAUTH } = require("../utils/constants");
const jwt = require("jsonwebtoken");

const VerifyAuth = (req, res, next) => {
    // with Coockie
    // const token = req.cookies.authToken;

    // with Token
    const token = req.headers.token;

    if (!token) {
        return res.status(UNAUTH).json({
            success:false,
            message:"لطفا وارد شوید!"
        })
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET_KEY, async (err, data) => {
        if (err) {
            return res.status(UNAUTH).json({
                success:false,
                message:"لطفا وارد شوید!"
            })
        }
        const user = await UserModel.findOne({_id:data.username})
        if(!user){
            const operator = await OperatorsModel.findOne({_id:data.username})
            req.user = operator; // ذخیره اطلاعات کاربر در درخواست
        }else{
            req.user = user; // ذخیره اطلاعات کاربر در درخواست
        }
        
        next(); // ادامه به middleware بعدی
    });
};

module.exports = {VerifyAuth}
