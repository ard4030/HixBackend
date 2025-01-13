const { ERROR, SUCCESS } = require("../utils/constants")
const { PlanModel } = require("../model/PlanModel");
const { checkExpirePlan, generateApiKey, sendReqZibal } = require("../utils/functions");
const { UserModel } = require("../model/UserModel");
const { Zibal } = require("../utils/Zibal");

class PlanController{

    async addPlan(req,res,next){
        try {
            
            const data = req.body;
            let message = ''
            if(data.id){
                const updatePlan = await PlanModel.updateOne({_id:data.id},{$set:{
                    name:data.name,
                    faName:data.faName,
                    conversations:data.conversations,
                    fileSize:data.fileSize,
                    operators:data.operators,
                    keepingConversationHistory:data.keepingConversationHistory,
                    reportsRobot:data.reportsRobot,
                    widgetCustomization:data.widgetCustomization,
                    apiAccess:data.apiAccess,
                    telegramConnect:data.telegramConnect,
                    preparedMessages:data.preparedMessages,
                    showProducts:data.showProducts,
                    removeHixAds:data.removeHixAds,
                    blockingAnnoyingUsers:data.blockingAnnoyingUsers,
                    voice:data.voice,
                    excelReports:data.excelReports,
                    saveHistory:data.saveHistory,
                    whatsAppConnect:data.whatsAppConnect,
                    qualityControl:data.qualityControl,
                    onlineUserDetails:data.onlineUserDetails,
                    allTime:data.allTime,
                    webApp:data.webApp,
                    simultaneousConversationWithUsers:data.simultaneousConversationWithUsers,
                    customizationWidgetLogo:data.customizationWidgetLogo,
                    onlineUsersMonitoring:data.onlineUsersMonitoring,
                    educationWebinar:data.educationWebinar,
                    officialInvoice:data.officialInvoice,
                    websiteSeoHelp:data.websiteSeoHelp,
                    webhook:data.webhook,
                    showCategorys:data.showCategorys,
                    comparison:data.comparison,
                    discountAutoSend:data.discountAutoSend,
                    intelligentInteractionWithUsers:data.intelligentInteractionWithUsers,
                    advice:data.advice,
                    keepingConversationHistory:data.keepingConversationHistory
                }})
                message = "پلن با موفقیت ویرایش شد"
            }else{
                const CreatePlan = await PlanModel.create({
                    name:data.name,
                    faName:data.faName,
                    conversations:data.conversations,
                    fileSize:data.fileSize,
                    operators:data.operators,
                    keepingConversationHistory:data.keepingConversationHistory,
                    reportsRobot:data.reportsRobot,
                    widgetCustomization:data.widgetCustomization,
                    apiAccess:data.apiAccess,
                    telegramConnect:data.telegramConnect,
                    preparedMessages:data.preparedMessages,
                    showProducts:data.showProducts,
                    removeHixAds:data.removeHixAds,
                    blockingAnnoyingUsers:data.blockingAnnoyingUsers,
                    voice:data.voice,
                    excelReports:data.excelReports,
                    saveHistory:data.saveHistory,
                    whatsAppConnect:data.whatsAppConnect,
                    qualityControl:data.qualityControl,
                    onlineUserDetails:data.onlineUserDetails,
                    allTime:data.allTime,
                    webApp:data.webApp,
                    simultaneousConversationWithUsers:data.simultaneousConversationWithUsers,
                    customizationWidgetLogo:data.customizationWidgetLogo,
                    onlineUsersMonitoring:data.onlineUsersMonitoring,
                    educationWebinar:data.educationWebinar,
                    officialInvoice:data.officialInvoice,
                    websiteSeoHelp:data.websiteSeoHelp,
                    webhook:data.webhook,
                    showCategorys:data.showCategorys,
                    comparison:data.comparison,
                    discountAutoSend:data.discountAutoSend,
                    intelligentInteractionWithUsers:data.intelligentInteractionWithUsers,
                    advice:data.advice,
                    keepingConversationHistory:data.keepingConversationHistory
                })
                message = "پلن با موفقیت ایجاد شد"
            }
            

            return res.status(SUCCESS).json({
                success:true,
                message:"پلن با موفقیت ایجادشد"
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    async getPlans(req,res,next){
        try {
            const Plans = await PlanModel.find({});

            return res.status(SUCCESS).json({
                success:true,
                data:Plans,
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message,
            })
        }
    }

    async setPlan(req,res,next){
        try {
            const {id} = req.body;
            const Plan = await PlanModel.findOne({_id:id});

            // Check Last User Plan
            if(req.user.planId){
                const expired = checkExpirePlan(req.user,Plan)
                if(String(Plan._id) === String(req.user.planId)) throw new Error("شما قبلا این پلن را انتخاب کردید")
            }

            // Check Exist Plan
            if(!Plan) throw new Error("پلن مورد نظر وجود ندارد");

            // Set Free Plan
            if(Plan.price === 0){
                const updateFreeUserPlan = await UserModel.updateOne({_id:req.user._id},{$set:{
                    planId:Plan._id,
                    apiKey:generateApiKey()
                }})
                return res.status(SUCCESS).json({
                    success:true,
                    message:"پلن شما با موفقیت انتخاب شد"
                })
            }


            // Set Price Plan
            const now = Date.now();
            let exp = 0
            if(Plan.expireMonth !== 0){
                exp = (60 * 60 * 60 * 24 * 30 * Plan.expireMonth) + now
            }
            
            const addUserPlan = await UserModel.updateOne({_id:req.user._id},{$set:{
                planId:Plan._id,
                apiKey:generateApiKey(),
                expirePlan:exp

            }})
            return res.status(SUCCESS).json({
                success:true,
                message:"پلن شما با موفقیت انتخاب شد"
            })

            // After Verify Domain
            // sendReqZibal()

        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message,
            }) 
        }
    }

}

module.exports = {
    PlanController : new PlanController()
}