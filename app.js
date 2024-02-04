require('dotenv').config()
const express = require('express');
const { Server } = require("socket.io");
const http = require('http');
const cors = require('cors');
const ConnectToMongo = require('./db');
const { AuthenticateUserForSocket } = require('./Middleware/Authentication');
const Chats = require('./Models/Chats');
const UserModel = require('./Models/User');
const path = require('path');


const app = express();
const PORT = process.env.PORT;
const mongoURL = process.env.MONGO_URL;
ConnectToMongo(mongoURL);

app.use(express.json());
app.use(cors({
    origin: 'http://mychatapp1.ap-south-1.elasticbeanstalk.com'
  }));
app.use(express.static(path.join(__dirname,'./client/build')));

//Routes
app.use('/user', require('./Routes/UserRoute'));   //userlogin and signup routes
app.use('/file',require('./Routes/FilesRoute'))    //file upload and download routes

//Rest API
app.use('*',(req,res)=>{
    res.sendFile(path.join(__dirname,'./client/build/index.html'))
})
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://mychatapp1.ap-south-1.elasticbeanstalk.com",
        methods: ['GET', 'POST']
    }
});
const Dashboard = io.of('/home');    //All cats info
const chat = io.of('/chat');         //Particular chat

Dashboard.use(AuthenticateUserForSocket);
chat.use(AuthenticateUserForSocket);

Dashboard.on('connection', (socket) => {
    const { user } = socket;
    socket.join(user._id);

    socket.on('getChats', async () => {
        let chats = await Chats.find({}).populate({ path: "participants.user", select: "name email _id" });
        chats = chats.filter((chat) => chat.participants.findIndex((participant) => String(participant.user._id) === user._id) != -1);
        let chatres = [];
        chats.forEach((chat) => {
            const reciver = chat.participants.findIndex((participant) => String(participant.user._id) !== user._id);
            chatres.push({ reciver: chat.participants[reciver].user, _id: chat._id });
        })
        socket.emit('loadChats', chatres);
    });

    socket.on('newChat', async (userEmail) => {
        const reciver = await UserModel.findOne({ email: userEmail }).select("name email _id");
        if (!reciver) {
            return socket.emit('newChat', "User not found");
        }
        let chat = await Chats.create({
            participants: [{
                user: user._id
            }, {
                user: reciver._id
            }],
            messages: []
        });
        socket.emit('newChat', { reciver, _id: chat._id });
        socket.broadcast.to(user._id).emit('newChat', { reciver, _id: chat._id });
        socket.broadcast.to(String(reciver._id)).emit('newChat', { reciver: user, _id: chat._id });
    })

})

chat.on('connection', (socket) => {
    const { chatID } = socket.handshake.auth;
    const { user } = socket;
    socket.join(chatID);
    socket.on('loadChatMsg', async () => {
        const chat = await Chats.findById(chatID).populate({ path: "messages.sender messages.reciver", select: "name email _id" });
        if (!chat) {
            socket.emit('loadChatMsg', chat)
            return;
        }
        const { messages } = chat;
        socket.emit('loadChatMsg', messages)
    })

    socket.on('newMsg', async (msg) => {
        let chat = await Chats.findById(chatID);
        let newMsg = {};
        if(msg.msgType=='text'){
            newMsg={
                msgType: msg.msgType,
                sender: user._id,
                reciver: msg.reciverID,
                msgContent: msg.data,
                filePath:""
            }
        }
        else{
            newMsg={
                msgType: msg.msgType,
                sender: user._id,
                reciver: msg.reciverID,
                msgContent: msg.data.filename,
                filePath:msg.data.path
            }
        }
        chat.messages.push(newMsg);
        await Chats.findByIdAndUpdate(chatID, { $set: chat });
        socket.emit('newMsg', { msgContent: newMsg.msgContent, msgType: newMsg.msgType, sender: user, reciver: newMsg.reciver,filePath:newMsg.filePath });
        socket.broadcast.to(chatID).emit('newMsg', { msgContent: newMsg.msgContent, msgType: newMsg.msgType, sender: user, reciver: newMsg.reciver,filePath:newMsg.filePath });
    })
})


server.listen(PORT, () => console.log(`Server Started on port: ${PORT}`));