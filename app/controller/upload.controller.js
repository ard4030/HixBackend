const { ERROR, SUCCESS } = require("../utils/constants");
const { uploadFileOperator } = require("../utils/functions");

class UploadController{

    async fileUpload(req,res,next){
        try {
            
            const file = req.file;
            const uplaod = await uploadFileOperator(file,String(req.user._id))

            return res.status(SUCCESS).json({
                success:true,
                message:"آپلود موفق",
                link:uplaod
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
    UploadController : new UploadController()
}