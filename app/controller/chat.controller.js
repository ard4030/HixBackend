const { SUCCESS, ERROR } = require("../utils/constants");
const { ChatModel } = require("../model/ChatModel");

class ChatController{

    async getChatsByMerchant(req,res,next){
        try {
            const data = await ChatModel.find({merchantId:req.user._id});

            return res.status(SUCCESS).json({
                success:true,
                data:data
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
    ChatController : new ChatController()
}