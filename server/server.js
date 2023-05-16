const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const formatMessage = require("./utils/messages");
const { userJoin, getCurrentUser , userLeaves , getRoomUsers} = require("./utils/users");
console.log((path.join(__dirname , "public")));
app.use(express.static(path.join(__dirname, "public")));

const botName = "Bot";
//  run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {

    const user = userJoin(socket.id, username , room);
   
    socket.join(user.room);
    // welcome current user
    socket.emit("message", formatMessage(botName, "welcome to ChatCord"));

    //broadcast when a user conects-
    //emit vs brodcast -> emit to only connecting client vs brodcast - everyone except connecting , io.emit() - to all
    socket.broadcast.to(user.room).emit(
      "message",
      formatMessage(botName, `${user.username} has joined the chat`)
    );
    io.to(user.room).emit('roomUsers',  {
        room : user.room,
        users : getRoomUsers(user.room),
    })
  });

  // listening for chat message
  socket.on("chatMessage", (message) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessage( user.username, message));
    console.log(message);
  });

  socket.on("disconnect", () => {
    const user = userLeaves(socket.id);
    if(user){
        io.to(user.room).emit("message" , formatMessage(botName , `${user.username} has left the chat`))
    }
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => {
  console.log("running on port 3000");
});
