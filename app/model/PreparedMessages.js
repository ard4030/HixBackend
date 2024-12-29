const mongoose = require('mongoose')

const Schema = new mongoose.Schema({
    question : {type:String , default:""},
    answer : {type:String , default:""},
    merchantId:{type:mongoose.Types.ObjectId},
},{
    timestamps : true
});
 
module.exports = {
    PreparedMessagesModel : mongoose.model("PreparedMessages",Schema)
}