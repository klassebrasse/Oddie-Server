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

const getUsersInRoom = async (lobby) => {
    return users.filter((user) => user.roomId === lobby);
}

const removeUser = (id) => {
    users = users.filter((user) => user.id !== id)
}

const getPushTokensInRoomExceptCurrentUser = async (roomId, id) => {
    const listOfTokens = []
    const usersInRoom = await getUsersInRoom(roomId)
    const allUsersExceptCurrentUSer = usersInRoom.filter(u => u.id !== id)

    allUsersExceptCurrentUSer.forEach(u => listOfTokens.push(u.deviceToken))

    console.log("LISTA AV TÖKKENS" + listOfTokens + " SLUT")
    return listOfTokens
}

const findUsernameInRoom = async (roomId, username) => {
    const usersInRoom = await getUsersInRoom(roomId);
    return await usersInRoom.find(user => {
        return user.username === username
    })
}

//ExponentPushToken[b_QoKmLyYb6oZnert13ZLo]
// ExponentPushToken[OGp7QDBzM9i0LTvO38gzrP]
async function sendPushNotification(expoPushToken, username) {
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: `${username} gick med i rummet`,
        //body: 'Klicka för att se användaren',
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

    socket.on('join room', async (roomId, username, expoPushToken, customColor) => {
        await socket.join(roomId);

        const randomColor = '#'+Math.floor(Math.random()*16777215).toString(16);
        await addUser(socket.id, roomId, username, expoPushToken, customColor)

        const listToEmit = await getUsersInRoom(roomId)
        //console.log(users)

        const listOfTokens = await getPushTokensInRoomExceptCurrentUser(roomId, socket.id)

        io.to(roomId).emit('users', listToEmit);
        //await sendPushNotification(listOfTokens, username)
    })

    socket.on('leave room', async (roomId) => {
        await removeUser(socket.id)

        const listToEmit = await getUsersInRoom(roomId)
        io.to(roomId).emit('users', listToEmit);
    })

    socket.on('check username', async (roomId, username, callback) => {
        const userObject = await findUsernameInRoom(roomId, username);

        callback({
            usernameIsOk: !userObject
        })

    })

});

server.listen(3000, () => {
    console.log('listening on *:3000');
});