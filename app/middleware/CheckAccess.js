
// Access
// ADD_PLAN

const { UNAUTH } = require("../utils/constants");

const CheckAccess = (access) => {

    return function(req,res,next){
        const Roles = req.user.Roles;
        access.forEach(item => {
            if(!Roles.includes(item)){
                return res.status(UNAUTH).json({
                    success:false,
                    message:"شما به این قسمت دسترسی ندارید"
                })
            }else{
                next()
            }
        })

    }
    

}

module.exports = {
    CheckAccess
}