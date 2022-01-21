const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

let users = [];
let odds = [];

const addUser = async (id, roomId, username, deviceToken, color) => {
    let newUser = {id: id, username: username, roomId: roomId, active: true, deviceToken: deviceToken, color: color, status: null, zips: 0}
    //await users.push(newUser)
    users.push(newUser)
    //return getUsersInRoom(lobby)
}

const getUsersInRoom = (lobby) => {
    return users.filter((user) => user.roomId === lobby)
}

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log("user disconnected")
    })

    socket.on('join room', async (roomId, username, color, deviceToken) => {
        await socket.join(roomId);

        await addUser(socket.id, roomId, username)

        const listToEmit = getUsersInRoom(roomId)
        console.log(users)

        io.to(roomId).emit("users", listToEmit);
    })

});

server.listen(3000, () => {
    console.log('listening on *:3000');
});