const http = require('http');
const express = require('express');
const app = express();
const socketio = require('socket.io');
const cors = require('cors');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');

const router = require('./router');
const BASE_URL=process.env.BASE_URL;

const server = http.createServer(app);
const io = socketio(server,{
  cors:{
    origin:'*',
    methods:['GET','POST']
  }
});

app.use(cors);
app.use(router);

 
 
io.on('connect', (socket) => {
 
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });
  
    if(error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.`});
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    
    const user = getUser(socket.id);
    console.log('SocketID:',socket.id)
    console.log('User:', user);
  
    if (user && user.room) {
      console.log('Emitting message to room:', user.room);
      io.to(user.room).emit('message', { user: user.name, text: message });
    }
  
    callback();
  });
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room)});
    }
  })
});

server.listen(BASE_URL || 5000, () => console.log(`Server has started.`));


