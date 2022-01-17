const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

let users = [];
let odds = [];

const addUser = async (id, lobby, username, deviceToken) => {
    let newUser = {id, username, lobby, active: true, deviceToken}
    await users.push(newUser)

    //return getUsersInRoom(lobby)
}

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log("user disconnected")
    })



});

server.listen(3000, () => {
    console.log('listening on *:3000');
});