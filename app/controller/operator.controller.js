const { OperatorsModel } = require("../model/OperatorsModel");
const { UNVALID, SUCCESS, ERROR, UNAUTH } = require("../utils/constants");
const { SignAccessToken, generateApiKey, hashPassword, unhashPassword } = require("../utils/functions");
const { RegisterValidation } = require("../validation/RegisterValidation");

class OperatorController{

    async addOperator(req,res,next){
        let data = req.body;
        data.merchantId = req?.user?._id;
        try {
            // Data Validation
            const validData = RegisterValidation(data);
            if(Object.keys(validData).length > 0){
                return res.status(UNVALID).json({
                    success:false,
                    data:validData
                })
            }

            const isOperator = await OperatorsModel.findOne({userName:data.userName})
            if(isOperator){
                return res.status(ERROR).json({
                    success:false,
                    message:"این اپراتور از قبل وجود داره"
                })
            }

            // Create Operator
            const create = await OperatorsModel.create({
                firstName:data.firstName,
                lastName:data.lastName,
                merchantId:data.merchantId,
                status:"active",
                userName:data.userName,
                password: await hashPassword(data.password),
                apikey:generateApiKey()
            })

            return res.status(SUCCESS).json({
                success:true,
                message:"اپراتور با موفقیت ایجاد شد"
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    async loginOperator(req,res,next){
        const { userName , password } = req.body;
        const isOpertor = await OperatorsModel.findOne({userName})
        if(!isOpertor){
            return res.status(UNAUTH).json({
                success:false,
                message:"نام کاربری یا رمز عبور نامعتبر"
            })
        }
        
        const pass = await unhashPassword(isOpertor.password,password)
 
        if(!pass){
            return res.status(UNAUTH).json({
                success:false,
                message:"نام کاربری یا رمز عبور نامعتبر"
            })
        }

        const finallToken = await SignAccessToken(isOpertor);


        res.cookie('authToken', finallToken, {
            secure:false,
            httpOnly: false, // فقط برای دسترسی از سمت سرور
            // secure: process.env.APP_STATUS === 'production', // فقط در HTTPS
            maxAge: 3600000 // زمان انقضای کوکی به میلی‌ثانیه
        });
        res.status(SUCCESS).json({
            success:true,
            message:"با موفقیت وارد شدید!"
        });
    }

}

module.exports = {
    OperatorController : new OperatorController()
}