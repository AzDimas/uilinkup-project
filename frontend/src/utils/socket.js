// utils/socket.js
import { io } from 'socket.io-client';

export const createSocket = () => {
  const token = localStorage.getItem('token');
  const socket = io('http://localhost:5000', {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true
  });
  return socket;
};
