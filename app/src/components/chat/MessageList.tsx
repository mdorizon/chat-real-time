import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { messageService, Message } from "../../services/messageService";
import { format, formatDistanceToNow, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { io } from "socket.io-client";
import { useAuth } from "../../contexts/AuthContext";
import { Heart, Hash } from "lucide-react";
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
  const { user: currentUser, updateUserId } = useAuth();
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
      console.log("MessageList - User connected with ID:", currentUser.id);
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

    // Écouter l'événement de mise à jour d'ID utilisateur
    socketRef.current.on("userIdUpdate", ({ oldId, newId, email }) => {
      console.log(`MessageList - Mise à jour d'ID: ${oldId} -> ${newId}`);

      // Si l'ID mis à jour correspond à l'utilisateur actuel, mettre à jour dans le contexte d'auth
      if (
        currentUser &&
        currentUser.id === oldId &&
        currentUser.email === email
      ) {
        updateUserId(oldId, newId);
      }

      // Mettre à jour les messages en temps réel si l'utilisateur a des messages
      setRealtimeMessages((prev) =>
        prev.map((msg) => {
          if (msg.user && msg.user.id === oldId) {
            return {
              ...msg,
              user: {
                ...msg.user,
                id: newId,
              },
            };
          }
          return msg;
        })
      );

      // Mettre à jour les likes dans les messages
      setRealtimeMessages((prev) =>
        prev.map((msg) => {
          if (msg.likedBy && msg.likedBy.includes(oldId)) {
            const updatedLikedBy = msg.likedBy.map((id) =>
              id === oldId ? newId : id
            );
            return {
              ...msg,
              likedBy: updatedLikedBy,
            };
          }
          return msg;
        })
      );
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [queryClient, currentUser, updateUserId]);

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
      {/* Message de bienvenue */}
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="h-16 w-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Hash className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">
          Bienvenue dans #général !
        </h1>
        <p className="text-gray-300 mb-4">C'est le début du salon #général.</p>
        <div className="h-px bg-gray-700 w-full max-w-md mx-auto my-6"></div>
      </div>

      <div className="space-y-0">
        {allMessages.map((message, index) => {
          // Vérifier si le message suivant est du même utilisateur
          const nextMessage = allMessages[index + 1];
          const isGrouped =
            nextMessage &&
            nextMessage.user?.id === message.user?.id &&
            new Date(nextMessage.createdAt).getTime() -
              new Date(message.createdAt).getTime() <
              300000; // 5 minutes

          return (
            <div
              key={message.id || `realtime-${index}`}
              className="group px-4 py-0.5 hover:bg-gray-750/30"
            >
              {/* Si premier message ou nouveau groupe, afficher l'avatar et le nom */}
              {index === 0 || !isGrouped ? (
                <div className="flex pt-4">
                  <div className="flex-shrink-0 pt-0.5 mr-4">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {message.user?.email?.[0].toUpperCase()}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-gray-800 ${
                          message.user?.connected
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">
                        {message.user?.email?.split("@")[0]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatMessageDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 break-words">{message.text}</p>
                    <div className="mt-1 flex">
                      <button
                        onClick={() => message.id && handleLike(message.id)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                          message.likedBy?.includes(currentUser?.id || "")
                            ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500"
                            : message.likes && message.likes > 0
                            ? "bg-gray-700 text-gray-200"
                            : "bg-gray-700/60 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            message.likes && message.likes > 0
                              ? "fill-red-500 stroke-red-500"
                              : "fill-none stroke-current"
                          }`}
                        />
                        <span>{message.likes ?? 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Message groupé (même utilisateur)
                <div className="flex pl-14">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 break-words">{message.text}</p>
                    <div className="mt-1 flex">
                      <button
                        onClick={() => message.id && handleLike(message.id)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                          message.likedBy?.includes(currentUser?.id || "")
                            ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500"
                            : message.likes && message.likes > 0
                            ? "bg-gray-700 text-gray-200"
                            : "bg-gray-700/60 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        }`}
                      >
                        <Heart
                          className={`h-3.5 w-3.5 ${
                            message.likes && message.likes > 0
                              ? "fill-red-500 stroke-red-500"
                              : "fill-none stroke-current"
                          }`}
                        />
                        <span>{message.likes ?? 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
