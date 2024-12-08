const { OptionModel } = require("../model/Option");
const { SUCCESS, ERROR } = require("../utils/constants");

class OptionController{

    complateOption = {
        language:"فارسی",
        description:""
    }

    async addOption(req,res,next){
        const options = req.body;
        try {
            const isMerchant = await OptionModel.findOne({merchantId:req.user._id})
            if(isMerchant){
                await OptionModel.updateOne({merchantId:req.user._id},{$set:{
                    options
                }})
            }else{
                await OptionModel.create({
                    merchantId:req.user._id,
                    options
                })
            }

            return res.status(SUCCESS).json({
                success:true,
                message:"موفق!"
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
    OptionController : new OptionController()
}