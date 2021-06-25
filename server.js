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
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId, userName);

    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId); //broadcast to all users except the user who disconnected
    });
  });
});

server.listen(PORT);
console.log(`server up and running at port ${PORT}`);
