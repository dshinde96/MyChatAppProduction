const mongoose=require('mongoose');
const {Schema}=mongoose;

const Chat=new Schema({
    participants:[{
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        }
    }],
    messages:[{
        msgType:{
            type:String,
            required:true
        },
        sender:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        reciver:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
        msgContent:{
            type:String,
            required:true
        },
        filePath:{
            type:String
        }
    }]
},{timestamps:true})

module.exports=mongoose.model("Chat",Chat);