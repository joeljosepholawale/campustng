import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { initSocket } from './socket';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.IO enabled`);
});
