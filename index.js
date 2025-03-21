const express = require('express');
const { chats } = require('./data/data');
const userRoutes = require('./routes/userRoutes');
const connectDB = require('./config/db');
const path = require('path')
const app = express();
const { notFound, errorHandler } = require('./middleware/middleware');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messagesRoutes');

require('dotenv').config({path:path.resolve(__dirname,'./.env')})

connectDB(); 

app.use(express.json());


app.get('/', (req, res) => {  
    res.send('Hello World!');
});
 
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use("/api/message",messageRoutes); 


app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});