const path=require("path");
const http=require("http");
const Filter=require("bad-words");
const {generate_message,generateLocationMessages}=require("./utils/messages");
const express= require("express");
const socketio=require("socket.io");
const { addUser,removeUser,getUser,getUsersInRoom }=require("./utils/users");

const app=express();
const server=http.createServer(app);
const io=socketio(server);
const publicDirectoryPath=path.join(__dirname,"../public");
app.use(express.static(publicDirectoryPath));
const msg="Welcome!"
io.on("connection",(socket)=>{
    console.log("New websocket connection!");
    
    socket.on("join", (options, callback)=>{
        const{error,user}=addUser({ id: socket.id, ...options})
        if(error){
            return callback(error);

        }

        socket.join(user.room);
        socket.emit("Message",generate_message("Admin","Welcome!"));
        socket.broadcast.to(user.room).emit("Message",generate_message("Admin",`${user.username} has joined!`));
        io.to(user.room).emit("roomData",{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback();

    })
    socket.on("SendMessage",(msg,callback)=>{
        const user=getUser(socket.id);
        const filter=new Filter();
        if(filter.isProfane(msg)){
            return callback("Profanity is not encouraged!");
        }
        io.to(user.room).emit("Message",generate_message(user.username,msg));
        callback();
    })
    socket.on("disconnect",()=>{
        const user=removeUser(socket.id);
        if(user){
            io.to(user.room).emit("Message",generate_message("Admin",`${user.username} has just left!`));
            io.to(user.room).emit("roomData",{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })
    socket.on("send-location",(coords,callback)=>{
        const user=getUser(socket.id);
        io.to(user.room).emit("location_message",generateLocationMessages(user.username,`https://google.com/maps?q=${coords.latitude},${coords.longitude}`));
        callback();
    })
})



server.listen(3000,()=>{
    console.log("Server is up and running on port 3000!");
})
