const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    options:{type:Object,default:{}},
    merchantId:{type:mongoose.Types.ObjectId},
},{
    timestamps:true
})

module.exports = {
    OptionModel : mongoose.model("option",Schema)
}