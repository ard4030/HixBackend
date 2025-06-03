const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    firstName : {type:String , default:""},
    lastName : {type:String , default:""},
    merchantId:{type:mongoose.Types.ObjectId},
    status:{type:String,default:"pending"},
    userName:{type:String,default:""},
    password:{type:String,default:""},
    apikey:{type:String,default:""},
    telegramToken:{type:String,default:""},
    telegramCode:{type:String,default:""},
    Roles:{type:[String],default:["OPERATOR"]},
},{
    timestamps : true
});
 
module.exports = {
    OperatorsModel : mongoose.model("operator",Schema)
}