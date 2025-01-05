
// Access
// ADD_PLAN

const { UNAUTH } = require("../utils/constants");

const CheckAccess = (access) => {

    return function(req,res,next){
        // const Roles = req.user.Roles;
        // let success = false;
        // let message = "شما به این قسمت دسترسی ندارید"
        // access.forEach(item => {
        //     if(!Roles.includes(item)){
        //         return res.status(UNAUTH).json({
        //             success:false,
        //             message:"شما به این قسمت دسترسی ندارید"
        //         })
        //     }else{
        //         next()
        //     }
        // })

        // 
        const hasPermission = access.some(permission => 
            req.user.Roles.includes(permission)
        );
        
        if (hasPermission) {
            next()
            // console.log('دسترسی داده شده است');
        } else {
            return res.status(UNAUTH).json({
                success:false,
                message:"شما به این قسمت دسترسی ندارید"
            })
            // console.log('دسترسی رد شده است');
        }

    }
    

}

module.exports = {
    CheckAccess
}