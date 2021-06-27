const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
const server = require("http").Server(app);
const io = require("socket.io")(server); //socket.io should know wher the server is running

//enable cors
// CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options
// const cors = require("cors");
// app.use(cors());

//Peerjs Server
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
  // ssl: {},
  // proxied: true,
});

app.use("/peerjs", peerServer);

//Heroku
let PORT = process.env.PORT;
if (PORT == null || PORT == "") {
  PORT = 3000;
}

//static folder
app.use(express.static("public"));

//set view engine to ejs
app.set("view engine", "ejs");

//get req
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/redirect", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

//on scoket connection
io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.nickname = userName;
    socket.join(roomId);

    const clients = io.sockets.adapter.rooms.get(roomId);

    let namesArr = [];
    for (const clientId of clients) {
      //this is the socket of each client in the room.
      const clientSocket = io.sockets.sockets.get(clientId);

      namesArr.push(clientSocket.nickname);
    }

    //broadcast to all other sockets in that room except the socket who joined just now
    socket.broadcast.to(roomId).emit("user-connected", userId, userName);

    //event send to all sockets in specific room
    io.sockets.in(roomId).emit("updateNames", namesArr);

    //when a socket disconnects
    socket.on("disconnect", () => {
      console.log("disconected");
      const UpdatedClients = io.sockets.adapter.rooms.get(roomId);

      let UpdatedNamesArr = [];
      if (UpdatedClients) {
        for (const clientId of UpdatedClients) {
          //this is the socket of each client in the room.
          const clientSocket = io.sockets.sockets.get(clientId);

          UpdatedNamesArr.push(clientSocket.nickname);
        }
      }

      socket.broadcast
        .to(roomId)
        .emit("user-disconnected", userId, UpdatedNamesArr); //broadcast to all users except the user who disconnected

      //event send to all sockets in room
      // io.sockets.in(roomId).emit("updateNames", UpdatedNamesArr);
    });

    //recieved message
    socket.on("messageSent", (message, position, myUserName) => {
      socket.broadcast
        .to(roomId)
        .emit("messageRecieved", message, position, myUserName);
    });
  });
});

server.listen(PORT);
console.log(`server up and running at port ${PORT}`);
