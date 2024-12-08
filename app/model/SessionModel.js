const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    name:{type:String,default:""},
},{
    timestamps:true
})

module.exports = {
    SessionModel:mongoose.model("sessionmodel",Schema)
}