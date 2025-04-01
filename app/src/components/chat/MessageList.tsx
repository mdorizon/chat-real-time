import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { messageService, Message } from "../../services/messageService";
import { format, formatDistanceToNow, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { io } from "socket.io-client";

interface RealtimeMessage {
  id?: string;
  text: string;
  createdAt: Date;
  user?: {
    id: string;
    email: string;
    connected?: boolean;
  };
}

interface UserConnectionUpdate {
  userId: string;
  connected: boolean;
}

interface ConnectedClient {
  clientId: string;
  user: {
    id: string;
    email: string;
  };
  connected: boolean;
  lastConnected: Date;
}

const MessageList: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<RealtimeMessage[]>(
    []
  );
  const [userConnections, setUserConnections] = useState<
    Record<string, boolean>
  >({});

  const {
    data: dbMessages,
    isLoading,
    error,
  } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: () => messageService.findAll(),
  });

  useEffect(() => {
    const socket = io("http://localhost:8000");

    socket.on("messageFromServer", (message: RealtimeMessage) => {
      // Vérifier que le message n'est pas vide et qu'il a un texte
      if (message && message.text && message.text !== "newMessage") {
        // S'assurer que la date est un objet Date
        const messageWithDate = {
          ...message,
          createdAt: new Date(message.createdAt),
        };
        setRealtimeMessages((prev) => [...prev, messageWithDate]);
      }
    });

    socket.on("userConnectionUpdate", (update: UserConnectionUpdate) => {
      setUserConnections((prev) => ({
        ...prev,
        [update.userId]: update.connected,
      }));
    });

    socket.on("connectedClients", (clients: ConnectedClient[]) => {
      const connectionStatus: Record<string, boolean> = {};
      clients.forEach((client) => {
        connectionStatus[client.user.id] = client.connected;
      });
      setUserConnections(connectionStatus);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dbMessages, realtimeMessages]);

  const formatMessageDate = (date: string | Date) => {
    const messageDate = new Date(date);
    const now = new Date();

    // Si le message date de plus de 24h
    if (
      !isToday(messageDate) &&
      messageDate < new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ) {
      return format(messageDate, "dd/MM/yyyy HH:mm", { locale: fr });
    }

    // Sinon on affiche le temps relatif
    return formatDistanceToNow(messageDate, { locale: fr, addSuffix: true });
  };

  if (isLoading) {
    return <div className="text-center">Loading messages...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading messages. Please try again.
      </div>
    );
  }

  // Combiner et ajouter les statuts de connexion aux messages
  const allMessages = [
    ...(dbMessages || []).map((message) => ({
      ...message,
      user: message.user
        ? {
            ...message.user,
            connected: userConnections[message.user.id] || false,
          }
        : undefined,
    })),
    ...realtimeMessages.map((message) => ({
      ...message,
      user: message.user
        ? {
            ...message.user,
            connected: userConnections[message.user.id] || false,
          }
        : undefined,
    })),
  ];

  return (
    <div className="relative">
      <div className="space-y-4 pt-2">
        {allMessages.map((message, index) => (
          <div
            key={message.id || `realtime-${index}`}
            className="rounded-lg bg-white p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                    {message.user?.email?.[0].toUpperCase()}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                      message.user?.connected ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {message.user?.email}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatMessageDate(message.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800">{message.text}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
