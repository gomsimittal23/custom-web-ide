import { io } from 'socket.io-client';

const socket = io('http://localhost:9000', {
    autoConnect: false,
});

export default socket;