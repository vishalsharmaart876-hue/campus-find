import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [incomingNotification, setIncomingNotification] = useState(null);
  const [campusBroadcastItem, setCampusBroadcastItem] = useState(null);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    // Connect to external server or same host via proxy
    const socketEndpoint = import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api', '') : window.location.origin);
    const newSocket = io(socketEndpoint, {
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

    newSocket.on('campus_broadcast_item', (data) => {
      setCampusBroadcastItem(data);

      // Trigger Native Mobile / Desktop Push Notification
      try {
        if ('Notification' in window && Notification.permission === 'granted') {
          const notif = new Notification(data.toastTitle || 'CampusFind Alert', {
            body: data.toastMessage || `${data.title} reported at ${data.locationName}`,
            icon: '/favicon.svg',
            tag: `item-${data.id}`
          });
          notif.onclick = () => {
            window.focus();
            window.location.href = `/items/${data.id}`;
          };
        }
      } catch (err) {
        // ignore notification error on mobile browsers without service worker
      }
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
        campusBroadcastItem,
        clearBroadcastItem: () => setCampusBroadcastItem(null),
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
