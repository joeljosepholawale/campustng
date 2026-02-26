import http from 'http';
import { Server } from 'socket.io';
import app from './app';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*', // For Expo Go local Wi-Fi connectivity
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a conversation-specific room
    socket.on('join_conversation', (conversationId) => {
        const roomName = `conv_${conversationId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    // Relay messages within a conversation room
    socket.on('send_message', (data) => {
        // Broadcasts to other users in the same room
        socket.to(`conv_${data.conversationId}`).emit('receive_message', data);
    });

    // Study Group Chat rooms
    socket.on('join_group', (groupId) => {
        const roomName = `group_${groupId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined study group: ${roomName}`);
    });

    socket.on('send_group_message', (data) => {
        socket.to(`group_${data.groupId}`).emit('receive_group_message', data);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.IO enabled`);
});
