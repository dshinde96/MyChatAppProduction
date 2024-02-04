const mongoose=require('mongoose');

const ConnectToMongo=(mongoURL)=>{
    mongoose.connect(mongoURL).then(()=>console.log("Connected to DB")).catch((error)=>console.log(error.message))
}

module.exports=ConnectToMongo;