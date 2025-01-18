const { default: mongoose } = require("mongoose")
const {ChatModel} = require("../model/ChatModel")
const {OperatorsModel} = require("../model/OperatorsModel")

const SaveMessageOperator = async (data,user,ai) => {
 
    const message = {
        id: new mongoose.Types.ObjectId,
        type:data.type,
        sender:ai?"ai": data.qs? "qs" :"operator",
        seen:false,
        datatime:data.time,
        content:data.qs?data.item.value:data.message,
        isFile:false,
        data:data.data || [],
        isFile:false,
        link:data.link || "",
        fullTime:data.fullTime,
        fileName:data.fileName?data.fileName:""
    }

    const isChat = await ChatModel.findOne({sid:user.cookieId,merchantId:user.merchantId})
    if(isChat){
        await ChatModel.updateOne({sid:user.cookieId,merchantId:user.merchantId},{
            $push:{messages:message}
        })
    }else{
        await ChatModel.create({
            name:ai?"ai":"operator",
            email:user?.userName?user?.userName:"",
            merchantId:user.merchantId,
            sid:user.cookieId,
            messages:[message],
            data:[],
        })
    }
}

const SaveMessageClient = async (data,user) => {
    const message = {
        id: new mongoose.Types.ObjectId,
        sender:"guest",
        name:user?.name?user?.name:"مهمان",
        seen:false,
        datatime:data.time,
        isFile:false,
        type:"",
        link:"",
        fullTime:data.fullTime,
        fileName:data.fileName?data.fileName:"",
        content:data.qs?data.item.key:data.message,
    }

    // Check Messages Type
    switch (data.type) {
        case "text":
            message.content = data.qs?data.item.key:data.message
            message.type = data.type
            break;
        case "application/x-zip-compressed":
            message.link = data.link
            message.type = data.type
            break;
        case "application/pdf":
            message.link = data.link
            message.type = data.type
            break;
        case "video/mp4":
            message.link = data.link
            message.type = data.type
            break;
        case "audio/wav":
            message.link = data.link
            message.type = data.type
            break;
        default:
            break;
    }

    if(data.type.includes("image")){
        message.type = data.type
        message.link = data.link
    }

    const isChat = await ChatModel.findOne({sid:user.cookieId,merchantId:user.merchantId});
    let saveMessage = null;
    if(isChat){
        saveMessage = await ChatModel.updateOne({sid:user.cookieId,merchantId:user.merchantId},{
            $push:{messages:message}
        })
    }else{
        saveMessage = await ChatModel.create({
            name:user.name,
            email:user.email,
            sid:user.cookieId,
            merchantId:user.merchantId,
            messages:[message]
        })
    }
  
}

const getMessageBySid = async (sid) => {
    const messages = await ChatModel.findOne({sid})
    return messages?.messages || []
}

module.exports = {
    SaveMessageOperator,SaveMessageClient,getMessageBySid
}