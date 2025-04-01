import { useAuth } from "@/contexts/AuthContext";
import React, { useEffect, useState } from "react";
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
  const { user } = useAuth();

  useEffect(() => {
    const socket = io("http://localhost:8000");
    socket.on("connect", () => {
      if (!user) return;
      socket.emit("clientConnected", user);
    });

    socket.on("connectedClients", (data: ClientType[]) => {
      // Convertir les dates string en objets Date
      const usersWithDates = data.map((user) => ({
        ...user,
        lastConnected: new Date(user.lastConnected),
      }));
      setConnectedUsers(usersWithDates);
      console.log("a user connected or disconnected", usersWithDates);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

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

  return (
    <div className="flex flex-wrap gap-3 p-4 items-center h-full">
      {sortedUsers.map((client) => (
        <TooltipProvider key={client.clientId}>
          <Tooltip>
            <TooltipTrigger>
              <div className="relative group">
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                  {client.user.email[0].toUpperCase()}
                </div>
                <div
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white
                    ${client.connected ? "bg-green-500" : "bg-gray-400"}`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-semibold">{client.user.email}</p>
                {!client.connected && (
                  <p className="text-gray-400">
                    {formatLastSeen(client.lastConnected)}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default UserList;
