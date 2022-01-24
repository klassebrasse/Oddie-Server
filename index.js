import fetch from "node-fetch";
import express from "express"
import * as http from "http";
import {Server} from "socket.io"

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = [];
let odds = [];

const addUser = async (id, roomId, username, deviceToken, color) => {
    let newUser = {
        id: id,
        username: username,
        roomId: roomId,
        active: true,
        deviceToken: deviceToken,
        color: color,
        status: null,
        zips: 0
    }
    //await users.push(newUser)
    users.push(newUser)
    //return getUsersInRoom(lobby)
}

const getUsersInRoom = (lobby) => {
    return users.filter((user) => user.roomId === lobby)
}

async function sendPushNotification(expoPushToken) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: 'Ny användare kom in i rummet',
        body: 'Klicka för att se användaren',
        data: {someData: 'goes here'},
    };

    await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
    });
}


io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log("user disconnected")
    })

    socket.on('join room', async (roomId, username, expoPushToken) => {
        await socket.join(roomId);

        await addUser(socket.id, roomId, username, expoPushToken)

        const listToEmit = getUsersInRoom(roomId)
        console.log(users)

        io.to(roomId).emit("users", listToEmit);
        console.log(expoPushToken)
        await sendPushNotification(expoPushToken)


    })

});

server.listen(3000, () => {
    console.log('listening on *:3000');
});