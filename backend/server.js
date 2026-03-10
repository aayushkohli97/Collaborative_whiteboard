const express = require("express");
const app = express();

const server = require("http").createServer(app);
const {Server } = require("socket.io");
const {addUser,removeUser,getUser, getUsersInRoom} = require("./utils/users")
const io = new Server(server);

const rooms = {};

app.get("/",(req,res)=>{
    res.send("This is mern realtime board sharing app ");
});

io.on("connection",(socket)=>{

    socket.on("userJoined",(data) =>{

        const {roomId} = data;

        socket.join(roomId);
        socket.userId = data.userId;   

        const users = addUser(data);
        const roomusers = getUsersInRoom(roomId);

        io.to(roomId).emit("roomUsers",{
            users : roomusers,
            count: roomusers.length
        });

        socket.emit("roomUsers",{
            users: roomusers,
            count: roomusers.length
        });

        socket.emit("userIsJoined",{success:true,users});

        // send board snapshot to new user
        if(rooms[roomId] && rooms[roomId].board){
            socket.emit("whiteboardData",{
                img: rooms[roomId].board,
                roomId: roomId
            });
        }

    });

    socket.on("whiteboardData",(data)=>{

        const {roomId,img} = data;

        if(!rooms[roomId]){
            rooms[roomId] = {};
        }

        rooms[roomId].board = img;

        socket.broadcast.to(roomId).emit("whiteboardData",data);

    });

    socket.on("disconnect",()=>{

        const user = removeUser(socket.userId);

        if(user){

            const roomusers = getUsersInRoom(user.roomId);
            
            io.to(user.roomId).emit("roomUsers",{
                users: roomusers,
                count : roomusers.length
            });

        }

    });

});

const port = process.env.PORT || 5000;

server.listen(port,()=> console.log("server is running on http://localhost:5000"));