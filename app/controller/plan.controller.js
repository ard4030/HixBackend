const { ERROR, SUCCESS } = require("../utils/constants")
const { PlanModel } = require("../model/PlanModel");

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

}

module.exports = {
    PlanController : new PlanController()
}