const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    firstName : {type:String , default:""},
    lastName : {type:String , default:""},
    email : {type:String , default:""},
    userName : {type:String , default:""},
    mobile : {type:String , default:""},
    password : {type:String , default:""},
    profilePic : {type:String , default:""},
    favorits : {type:[mongoose.Types.ObjectId] , default:[]},
    otp : {type:Object,default:{
        code:0,
        expiresIn: 0,
        timeSend:0
    }},
    Roles:{type:[String],default:["USER"]},
    apiKey:{type:String,default:""},
    planId:{type:mongoose.Types.ObjectId,default:null}
},{
    timestamps : true
});
 
module.exports = {
    UserModel : mongoose.model("user",Schema)
}