const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    name:{type:String,default:""},
    email:{type:String,default:""},
    sid:{type:String,default:""},
    messages:{type:[],default:[]},
    rate:{type:Number,default:0},
    merchantId:{type:mongoose.Types.ObjectId}
},{
    timestamps:true
})

module.exports = {
    ChatModel:mongoose.model("chatmodel",Schema)
}