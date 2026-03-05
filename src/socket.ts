import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*', // For Expo Go local Wi-Fi connectivity
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Join global user room for new chat notifications and updates
        socket.on('join_user', (userId: number | string) => {
            const roomName = `user_${userId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined global user room: ${roomName}`);
        });

        // Join a conversation-specific room
        socket.on('join_conversation', (conversationId: number | string) => {
            const roomName = `conv_${conversationId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined room: ${roomName}`);
        });

        // Study Group Chat rooms
        socket.on('join_group', (groupId: number | string) => {
            const roomName = `group_${groupId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined study group: ${roomName}`);
        });

        // We leave the old socket.on('send_message') intact if frontend still optimizes.
        // It's benign, but our service will now do the heavy lifting independently.
        socket.on('send_message', (data: any) => {
            socket.to(`conv_${data.conversationId}`).emit('receive_message', data);
        });

        socket.on('send_group_message', (data: any) => {
            socket.to(`group_${data.groupId}`).emit('receive_group_message', data);
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIo = (): SocketIOServer => {
    if (!io) {
        throw new Error('Socket.io has not been initialized!');
    }
    return io;
};
