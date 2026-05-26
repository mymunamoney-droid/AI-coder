import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket(handlers) {
  const socketRef = useRef(null);
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');
    socketRef.current = socket;
    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
    return () => socket.disconnect();
  }, []);
  return socketRef;
}
