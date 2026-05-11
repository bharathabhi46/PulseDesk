import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useSocket = () => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return undefined;
    const client = io(SOCKET_URL, { auth: { token } });
    setSocket(client);
    return () => client.disconnect();
  }, [token]);

  return socket;
};
