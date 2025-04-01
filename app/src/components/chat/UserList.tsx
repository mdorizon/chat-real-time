import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type ClientType = {
  clientId: string;
  user: UserType;
  connected: boolean;
  lastConnected: Date;
};

type UserType = {
  id: string;
  email: string;
};

const UserList: React.FC = () => {
  const [connectedUsers, setConnectedUsers] = useState<ClientType[]>([]);
  const { user, updateUserId } = useAuth();

  useEffect(() => {
    const socket = io("http://localhost:8000");
    socket.on("connect", () => {
      if (!user) return;
      socket.emit("clientConnected", user);
      console.log("Utilisateur connecté au websocket avec ID:", user.id);
    });

    socket.on("connectedClients", (data: ClientType[]) => {
      // Convertir les dates string en objets Date
      const usersWithDates = data.map((user) => ({
        ...user,
        lastConnected: new Date(user.lastConnected),
      }));
      setConnectedUsers(usersWithDates);
      console.log("Liste des utilisateurs mise à jour:", usersWithDates);
    });

    // Écouter l'événement de mise à jour d'ID utilisateur
    socket.on("userIdUpdate", ({ oldId, newId, email }) => {
      console.log(`Mise à jour d'ID reçue du serveur: ${oldId} -> ${newId}`);
      // Si l'ID mis à jour correspond à l'utilisateur actuel, mettre à jour dans le contexte d'auth
      if (user && user.id === oldId && user.email === email) {
        updateUserId(oldId, newId);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, updateUserId]);

  const formatLastSeen = (date: Date) => {
    return `Déconnecté depuis ${formatDistanceToNow(date, { locale: fr })}`;
  };

  // Trier les utilisateurs : connectés d'abord, puis déconnectés par date de dernière connexion
  const sortedUsers = [...connectedUsers].sort((a, b) => {
    // Si l'un est connecté et l'autre non
    if (a.connected !== b.connected) {
      return a.connected ? -1 : 1;
    }
    // Si les deux sont déconnectés, trier par date de dernière connexion (plus récent d'abord)
    if (!a.connected && !b.connected) {
      return b.lastConnected.getTime() - a.lastConnected.getTime();
    }
    return 0;
  });

  const onlineUsers = sortedUsers.filter((client) => client.connected);
  const offlineUsers = sortedUsers.filter((client) => !client.connected);

  return (
    <div className="px-2 py-4">
      {/* Section En ligne */}
      <div className="mb-4">
        <div className="px-2 mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            En ligne — {onlineUsers.length}
          </span>
        </div>
        <div className="space-y-0.5">
          {onlineUsers.map((client) => (
            <TooltipProvider key={client.clientId}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors duration-200">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {client.user.email[0].toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-800 bg-green-500" />
                    </div>
                    <span className="text-gray-300 text-sm truncate">
                      {client.user.email}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">{client.user.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      {/* Section Hors ligne */}
      {offlineUsers.length > 0 && (
        <div>
          <div className="px-2 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Hors ligne — {offlineUsers.length}
            </span>
          </div>
          <div className="space-y-0.5">
            {offlineUsers.map((client) => (
              <TooltipProvider key={client.clientId}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors duration-200 opacity-70">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                          {client.user.email[0].toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-gray-800 bg-gray-400" />
                      </div>
                      <span className="text-gray-400 text-sm truncate">
                        {client.user.email}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-semibold">{client.user.email}</p>
                      <p className="text-gray-400">
                        {formatLastSeen(client.lastConnected)}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
