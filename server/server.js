const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const socket = require('socket.io');

const users = {};

const io = socket(server, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  if (!users[socket.id]) {
    users[socket.id] = socket.id;
  }

  socket.emit('yourId', socket.id);

  io.emit('allUsers', users);

  socket.on('disconnect', () => {
    delete users[socket.id];
  });

  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('hey', {
      signal: data.signalData,
      from: data.from,
    });
  });

  socket.on('acceptCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });
});

server.listen(5000, () => console.log('server start at port 5000'));
