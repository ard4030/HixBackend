const mongoose = require("mongoose")

const Schema = new mongoose.Schema({
    title:{type:String,default:""},
    slug:{type:String,default:""},
    price:{type:Number,default:0},
    merchantId:{type:mongoose.Types.ObjectId},
    description:{type:String,default:""},
    category:{type:String,default:""},
    image:{type:String,default:""},
    rating:{type:Object,default:{
        rate:0,
        count:0
    }},
},{
    timestamps:true
})

module.exports = {
    ProductModel : mongoose.model("product",Schema)
}