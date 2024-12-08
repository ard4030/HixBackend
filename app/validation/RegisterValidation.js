const { default: mongoose } = require("mongoose")

let error = {}

const RegisterValidation = (data) => {

    // if(!data.userName || !data.password){
    //     error.userName = "لطفا نام کاربری را وارد کنید"
    // }

    // if(!data.password){
    //     error.password = "لطفا پسورد را وارد کنید"
    // }

    if(data?.userName?.length < 3 || data?.userName?.length > 15){
        error.userName = "نام کاربری باید حداقل 3 و حداکثر 15 کاراکتر باشد"
    }

    if(String(data.password).length < 5 || String(data.password).length > 16){
        error.password = "رمز عبور حداقل 5 و حداکثر 16 کاراکتر"
    }

    return error
}

const LoginValidator = (data) => {
    // if(!data.userName || !data.password){
    //     error.userName = "لطفا نام کاربری را وارد کنید"
    // }

    // if(!data.password){
    //     error.password = "لطفا پسورد را وارد کنید"
    // }

    return error
}

const OperatorValidator = (data) => {
    if(!data.userName || !data.password){
        error.userName = "لطفا نام کاربری را وارد کنید"
    }

    if(!data.password){
        error.password = "لطفا پسورد را وارد کنید"
    }

    if(data?.userName?.length < 3 || data?.userName?.length > 10){
        error.userName = "نام کاربری حداقل 3 و حداکثر 10 کاراکتر "
    }

    if(data?.password?.length < 5 || data?.password?.length > 16){
        error.password = "پسورد حداقل 5 و حداکثر 16 کاراکتر"
    }

    if(!data.merchantId){
        error.merchantId = "مقدار آی دی مرچنت نا معتبر"
    }

    if(!mongoose.Types.ObjectId(data.merchantId)){
        error.merchantId = "مقدار آی دی مرچنت نا معتبر"
    }

    if(!data.fisrtName){
        error.fisrtName = "لطفا نام خود را وارد کنید"
    }

    if(!data.lastName){
        error.lastName = "لطفا نام خانوادگی خود را وارد کنید"
    }

    return error
}

module.exports = {
    RegisterValidation,
    LoginValidator,
    OperatorValidator
}