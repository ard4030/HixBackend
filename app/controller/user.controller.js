const {OperatorsModel} = require("../model/OperatorsModel");
const { UserModel } = require("../model/UserModel");
const { UNVALID, UNAUTH, SUCCESS, ERROR } = require("../utils/constants");
const { hashPassword, unhashPassword, SignAccessToken, generateApiKey } = require("../utils/functions");
const { RegisterValidation, LoginValidator } = require("../validation/RegisterValidation");

class UserController{

    async addUser(req,res,next){
        const data = req.body;

        // console.log(data)
        try {
            // Validation Data
            const validation = RegisterValidation(data)
            if(Object.keys(validation).length > 0){
                return res.status(UNVALID).json({
                    success:false,
                    data:validation,
                })
            }   
            
            // Check Exist UserName
            const isUser = await UserModel.findOne({userName:data.userName});
            if(isUser) throw new Error("نام کاربری از قبل وجود دارد")
            
            // Hash Password 
            const hashPasswordFinall = await hashPassword(data.password);
            await UserModel.create({
                userName:data.userName,
                password:hashPasswordFinall,
                firstName:data.firstName,
                lastName:data.lastName
            })      

            return res.status(400).json({
                success:true,
                message:"ثبت نام با موفقیت انجام شد"
            })

            
        } catch (error) {
            return res.status(400).json({
                success:false,
                message:error.message
            })
        }
    }

    async login(req,res,next){
        const data = req.body;
        try {

            // Check login merchant or operator
            if(data.isOperator){
                const isOpertor = await OperatorsModel.findOne({userName:data.userName})
                if(!isOpertor){
                    return res.status(UNAUTH).json({
                        success:false,
                        message:"نام کاربری یا رمز عبور نامعتبر"
                    })
                }
                
                const pass = await unhashPassword(isOpertor.password,data.password)
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
                    maxAge: 1000 * 60 * 60 * 24 * 2 // زمان انقضای کوکی به میلی‌ثانیه
                });
                res.status(SUCCESS).json({
                    success:true,
                    data:isOpertor,
                    message:"با موفقیت وارد شدید!"
                });
            }else{

                const isUser = await UserModel.findOne({userName:data.userName});
                if(!isUser){
                    return res.status(UNAUTH).json({
                        success:false,
                        message:"نام کاربری یا رمز عبور اشتباه است"
                    })
                }

                const unHashPasswordFinall = await unhashPassword(isUser.password,data.password);
                if(!unHashPasswordFinall){
                    return res.status(UNAUTH).json({
                        success:false,
                        message:"نام کاربری یا رمز عبور اشتباه است"
                    })
                }
                const finallToken = await SignAccessToken(isUser);

                res.cookie('authToken', finallToken, {
                    secure:false,
                    httpOnly: true, // فقط برای دسترسی از سمت سرور
                    // secure: process.env.APP_STATUS === 'production', // فقط در HTTPS
                    maxAge: 1000 * 60 * 60 * 24 * 2 // زمان انقضای کوکی به میلی‌ثانیه
                });
                res.status(SUCCESS).json({
                    success:true,
                    data:isUser,
                    message:"با موفقیت وارد شدید!"
                });

                // return res.status(200).json({
                //     success:true,
                //     message:"Login Successful",
                //     accessToken:finallToken,
                //     user:isUser
                // })    
            }

        } catch (error) {
            return res.status(400).json({
                success:false,
                message:error.message
            })
        }
    }

    async checkLogin(req,res,next){
        return res.status(SUCCESS).json({
            message:"Success",
            data:req.user
        })
    }

    async setUserPlan(req,res,next){
        try {
            const data = req.body;

            const EditUserPlan = await UserModel.updateOne({_id:req.user._id},{$set:{
                planId:data.id,
                apiKey:generateApiKey()
            }})

            return res.status(SUCCESS).json({
                success:true,
                message:"پلن شما با موفقیت انتخاب شد"
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    async logOut(req,res,next){
        res.cookie('authToken', "", {
            secure:false,
            httpOnly: false, // فقط برای دسترسی از سمت سرور
            // secure: process.env.APP_STATUS === 'production', // فقط در HTTPS
            maxAge: 0 // زمان انقضای کوکی به میلی‌ثانیه
        });
        res.status(SUCCESS).json({
            success:true,
            message:"خارج شدید"
        });
    }

    async getOperators(req,res,next){
        try {
            const operators = await OperatorsModel.find({merchantId:req.user._id});
            return res.status(SUCCESS).json({
                success:true,
                data:operators
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }
}

module.exports = {UserController : new UserController()}