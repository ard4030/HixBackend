const { PreparedMessagesModel } = require("../model/PreparedMessages");
const { ERROR, SUCCESS } = require("../utils/constants")

class PreparedMessages {

    async addQuestion(req,res,next){
        try {
            const { question , answer } = req.body;
            const save = await PreparedMessagesModel.create({
                question,
                answer,
                merchantId:req.user.merchantId?req.user.merchantId:req.user._id
            })

            return res.status(SUCCESS).json({
                message:"اضافه شد!",
                success:true
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    async getQuestions(req,res,next){
        try {
            const questions = await PreparedMessagesModel.find({
                merchantId:req.user.merchantId?req.user.merchantId:req.user._id
            })

            return res.status(SUCCESS).json({
                success:true,
                data:questions
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    async deleteQuestion(req,res,next){
        try {
            const { id } = await req.body;
            const deleteItem = await PreparedMessagesModel.deleteOne({_id:id});

            return res.status(SUCCESS).json({
                success:true,
                message:"حذف شد"
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

    async updateQuestion(req,res,next){
        try {
            const { id , question , answer  } = await req.body;
            const updateItem = await PreparedMessagesModel.updateOne({_id:id},{$set:{
                question , answer
            }})

            return res.status(SUCCESS).json({
                success:true,
                message:"آپدیت شد"
            })
        } catch (error) {
            return res.status(ERROR).json({
                success:false,
                message:error.message
            })
        }
    }

}

module.exports = {
    PreparedMessages : new PreparedMessages()
}