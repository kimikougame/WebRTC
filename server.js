const http = require("http");
const { Server } = require("socket.io");
const express = require('express')
const app = express()
const server = http.createServer(app);
const io = new Server(server);
const { v4: uuidV4 } = require("uuid");
server.listen(process.env.PORT || 3030);
const path = require('path');
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get("/:room", (req, res) => {
    res.render("room", { roomId: req.params.room })
});

io.on("connection", (socket) => {
    socket.on("join-room", (roomId, userId) => {
        console.log("roomId:", roomId, "userId:", userId); // 追加
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);
        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", userId);
        })
    })
});

