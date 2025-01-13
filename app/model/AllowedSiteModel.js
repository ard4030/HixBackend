const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    name:{type:String,default:""},
    url:{type:String,default:""},
    isActive:{type:Boolean,default:true},
  
},{
    timestamps:true
})

module.exports = {
    AllowedSiteModel:mongoose.model('AllowedSite', Schema)

}