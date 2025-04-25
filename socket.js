const { Server } = require('socket.io');

let io;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', socket => {
    console.log('User connected:', socket.id);
  });
}

function sendMessageToClients(message) {
  if (io) {
    io.emit('new_message', message);
  }
}

module.exports = { setupSocket, sendMessageToClients };
