import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [incomingNotification, setIncomingNotification] = useState(null);

  useEffect(() => {
    // Connect to same host via Vite proxy or direct
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[Socket.io] Connected with id:', newSocket.id);
      if (user && user.id) {
        newSocket.emit('join_user_room', user.id);
      }
    });

    newSocket.on('receive_chat_message', (data) => {
      setIncomingMessage(data);
    });

    newSocket.on('new_notification', (data) => {
      setIncomingNotification(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && user && (user.id || user._id)) {
      const uid = user.id || user._id;
      socket.emit('join_user_room', uid);
    }
  }, [socket, user]);

  const joinConversation = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('join_conversation', conversationId);
    }
  };

  const leaveConversation = (conversationId) => {
    if (socket && conversationId) {
      socket.emit('leave_conversation', conversationId);
    }
  };

  const sendChatMessage = (messageData) => {
    if (socket) {
      socket.emit('send_chat_message', messageData);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        incomingMessage,
        incomingNotification,
        joinConversation,
        leaveConversation,
        sendChatMessage
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
