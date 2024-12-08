const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    name:{type:String,default:""},
    description:{type:String,default:""},
    method:{type:String,default:""},
    data:{type:Object,default:{}},
    headers:{type:Object,default:{}},
    collection:{type:String,default:""},
    url:{type:String,default:""},
  
},{
    timestamps:true
})

module.exports = {
    ChatModel:mongoose.model("chatmodel",Schema)
}