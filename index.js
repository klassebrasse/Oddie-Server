import fetch from "node-fetch";
import express from "express"
import * as http from "http";
import {Server} from "socket.io"
import { Timer } from 'timer-node';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = [];
let odds = [];

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log("Connected to portsssss:" + PORT);
})

const addUser = async (id, roomId, username, deviceToken, color) => {
    let newUser = {
        id: id,
        username: username,
        roomId: roomId,
        active: true,
        deviceToken: deviceToken,
        color: color,
        status: null,
        zips: 0,
        timeOuts: [
            {
                socketId: null,
                time: Timer,
            },
        ]
    }
    //await users.push(newUser)
    users.push(newUser)
    //return getUsersInRoom(lobby)
}

const uid = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const addOdd = async (roomId, sender, receiver, zips, id, receiverSocketId, senderUsername) => {
    let newOdd = {
        id: id,
        roomId: roomId,
        sender: sender,
        senderUsername : senderUsername,
        receiver: receiver,
        receiverSocketId: receiverSocketId,
        status: 0,
        zips: zips,
        receiverOdd: null,
        senderOdd: null,
        receiverGuess: null,
        senderGuess: null,
    }
    odds.push(newOdd)
}

const getOdd = async (id) => {
    return odds.filter((odd) => odd.id === id);
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

const getUserById = async (id) => {
    const userId = id;
    return await users.find(({id}) => id === userId)
}

const getUserByRoomIdAndUsername = async (roomId, username) => {
    const usersInRoom = await getUsersInRoom(roomId);
    const un = username
    return await usersInRoom.find(({username}) => username === un)
}

const findUsernameInRoom = async (roomId, username) => {
    const usersInRoom = await getUsersInRoom(roomId);
    return await usersInRoom.find(user => {
        return user.username === username
    })
}
const findIndexOfUser = async (id) => {
    return users.findIndex((obj => obj.id === id));
}

//ExponentPushToken[b_QoKmLyYb6oZnert13ZLo]
// ExponentPushToken[OGp7QDBzM9i0LTvO38gzrP]
async function sendPushNotification(expoPushToken, text) {
    console.log("Push notification, token: " + expoPushToken + ", message: " + text)
    const message = {
        to: expoPushToken,
        sound: 'default',
        title: text,
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
        await sendPushNotification(listOfTokens, `${username} gick med i rummet`)
    })


    socket.on('sending odds', async (username, zips, roomId, receiverSocketId, callback) => {
        const userToNotice = await getUserById(receiverSocketId)
        console.log("tok " + userToNotice.deviceToken)
        const sender = await users.find(u => u.id === socket.id)
        const id = await uid();
        await addOdd(roomId, socket.id, username, zips, id, receiverSocketId, sender.username);
        const index = await findIndexOfUser(socket.id);

        const timer = new Timer({label: 'test-timer'});
        timer.start()
        setTimeout(() => console.log(timer.time()), 4000)

        const newTimeout = {
            socketId: receiverSocketId,
            time: timer,
            test: "jajajajaj"
        }
        users[index].timeOuts.push(newTimeout)

        const newOdd = await getOdd(id)
        callback({
            oddsSent: newOdd.length
        })

        const listToEmit = odds.filter((o) => o.roomId === roomId)

        io.to(receiverSocketId).emit('update list', listToEmit);
        await sendPushNotification(userToNotice.deviceToken, `${sender.username} oddsade dig`)
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

    socket.on('get odds', async (roomId, callback) => {
        const listToEmit = odds.filter((o) => o.roomId === roomId)
        console.log("get odds triggas")
        callback({
            oddsList: listToEmit
        })
    })

    socket.on('accept odd', async (oddId, receiverOdds, receiverGuess) => {
        const index = odds.findIndex((obj => obj.id === oddId));

        odds[index].receiverOdd = receiverOdds;
        odds[index].status = 1;
        odds[index].receiverGuess = receiverGuess;

        const listToEmit = odds.filter((o) => o.roomId === odds[index].roomId)
        io.to([socket.id, odds[index].sender]).emit('update list', listToEmit);

        const tempUser = await getUserById(odds[index].sender)
        const token = tempUser.deviceToken

        await sendPushNotification(token, `${odds[index].receiver} har gissat på din odds. Din tur att gissa`)
    })

    socket.on('update user list', async (roomId, callback) => {
        const listToEmit = await getUsersInRoom(roomId)

        io.to(roomId).emit('users', listToEmit);
    })

    socket.on('sender guess', async (oddId, myGuess) => {
        const index = odds.findIndex((obj => obj.id === oddId));
        odds[index].senderGuess = myGuess;
        odds[index].status = 2;

        const listToEmit = odds.filter((o) => o.roomId === odds[index].roomId);
        io.to([socket.id, odds[index].receiverSocketId]).emit('update list', listToEmit);

        const tempUser = await getUserById(odds[index].receiverSocketId)
        const token = tempUser.deviceToken

        await sendPushNotification(token, `${odds[index].senderUsername} har gissat. Kolla hur det gick`)
    })

});