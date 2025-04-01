import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { messageService, Message } from "../../services/messageService";
import { format, formatDistanceToNow, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";

interface RealtimeMessage {
  id?: string;
  text: string;
  createdAt: Date;
  likes?: number;
  likedBy?: string[];
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

interface MessageLikeUpdate {
  messageId: string;
  likes: number;
  likedBy: string[];
}

const MessageList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<RealtimeMessage[]>(
    []
  );
  const [userConnections, setUserConnections] = useState<
    Record<string, boolean>
  >({});
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  const {
    data: dbMessages,
    isLoading,
    error,
  } = useQuery<Message[]>({
    queryKey: ["messages"],
    queryFn: () => messageService.findAll(),
  });

  useEffect(() => {
    socketRef.current = io("http://localhost:8000");

    // Connecter l'utilisateur au WebSocket
    if (currentUser) {
      socketRef.current.emit("clientConnected", {
        id: currentUser.id,
        email: currentUser.email,
      });
    }

    socketRef.current.on("messageFromServer", (message: RealtimeMessage) => {
      if (message && message.text && message.text !== "newMessage") {
        const messageWithDate = {
          ...message,
          createdAt: new Date(message.createdAt),
          likes: 0,
          likedBy: [],
        };
        setRealtimeMessages((prev) => [...prev, messageWithDate]);
      }
    });

    socketRef.current.on(
      "messageLikeUpdate",
      ({ messageId, likes, likedBy }: MessageLikeUpdate) => {
        // Mettre à jour les messages en temps réel
        setRealtimeMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, likes, likedBy } : msg
          )
        );

        // Mettre à jour les messages de la base de données
        queryClient.setQueryData<Message[]>(["messages"], (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((msg) =>
            msg.id === messageId ? { ...msg, likes, likedBy } : msg
          );
        });
      }
    );

    socketRef.current.on(
      "userConnectionUpdate",
      (update: UserConnectionUpdate) => {
        setUserConnections((prev) => ({
          ...prev,
          [update.userId]: update.connected,
        }));
      }
    );

    socketRef.current.on("connectedClients", (clients: ConnectedClient[]) => {
      const connectionStatus: Record<string, boolean> = {};
      clients.forEach((client) => {
        connectionStatus[client.user.id] = client.connected;
      });
      setUserConnections(connectionStatus);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [queryClient, currentUser]);

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

  const handleLike = (messageId: string) => {
    if (!currentUser || !socketRef.current) {
      toast.error("Vous devez être connecté pour liker un message");
      return;
    }

    try {
      socketRef.current.emit("toggleLike", { messageId });

      // Fonction de mise à jour pour un message
      const updateMessage = (msg: Message) => {
        if (msg.id === messageId) {
          const hasLiked = msg.likedBy?.includes(currentUser.id) || false;
          return {
            ...msg,
            likes: (msg.likes || 0) + (hasLiked ? -1 : 1),
            likedBy: hasLiked
              ? (msg.likedBy || []).filter((id) => id !== currentUser.id)
              : [...(msg.likedBy || []), currentUser.id],
          };
        }
        return msg;
      };

      // Mise à jour optimiste des messages en temps réel
      setRealtimeMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            const hasLiked = msg.likedBy?.includes(currentUser.id) || false;
            return {
              ...msg,
              likes: (msg.likes || 0) + (hasLiked ? -1 : 1),
              likedBy: hasLiked
                ? (msg.likedBy || []).filter((id) => id !== currentUser.id)
                : [...(msg.likedBy || []), currentUser.id],
            };
          }
          return msg;
        })
      );

      // Mise à jour optimiste des messages de la base de données
      queryClient.setQueryData<Message[]>(["messages"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map(updateMessage);
      });
    } catch (error) {
      console.error("Erreur lors du like:", error);
      toast.error("Une erreur est survenue lors du like");
    }
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
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => message.id && handleLike(message.id)}
                    className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full transition-colors ${
                      message.likedBy?.includes(currentUser?.id || "")
                        ? "text-red-500 bg-red-50 hover:bg-red-100"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        message.likedBy?.includes(currentUser?.id || "")
                          ? "fill-red-500 stroke-red-500"
                          : "fill-none stroke-current"
                      }`}
                    />
                    <span className="ml-1">{message.likes || 0}</span>
                  </button>
                </div>
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
