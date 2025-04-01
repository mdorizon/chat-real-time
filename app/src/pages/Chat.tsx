import { useAuth } from "@/contexts/AuthContext";
import MessageForm from "../components/chat/MessageForm";
import MessageList from "../components/chat/MessageList";
import LogoutButton from "../components/LogoutButton";
import UserList from "@/components/chat/UserList";
import {
  Hash,
  ChevronDown,
  Plus,
  Users,
  Settings,
  Bell,
  Megaphone,
  Pin,
  Search,
  Bot,
  Mic,
  Headphones,
} from "lucide-react";

const Chat = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      <div className="flex flex-col">
        {/* Barre des serveurs (tout à gauche) */}
        <div className="w-[72px] bg-[#1E1F22] flex flex-col items-center py-2 space-y-2 h-[calc(100vh-52px)]">
          {/* Icône Discord/Home */}
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center cursor-pointer mb-2 transition-all hover:rounded-xl hover:bg-indigo-500">
            <Bot className="h-7 w-7 text-white" />
          </div>

          <div className="w-8 h-0.5 bg-gray-700 rounded-full my-1"></div>

          {/* Icône du serveur actuel */}
          <div className="relative group">
            <div className="absolute -left-1 w-1 h-10 bg-white rounded-r-full transition-all"></div>
            <div className="w-12 h-12 bg-[#313338] rounded-2xl flex items-center justify-center text-2xl font-bold text-white cursor-pointer">
              D
            </div>
          </div>

          {/* Bouton d'ajout de serveur */}
          <div className="mt-auto w-12 h-12 bg-[#313338] rounded-full flex items-center justify-center cursor-pointer transition-all hover:rounded-2xl hover:bg-green-600">
            <Plus className="h-6 w-6 text-green-500 hover:text-white" />
          </div>
        </div>

        {/* Barre latérale gauche - Liste des discussions */}
        <div className="absolute left-[72px] top-0 bottom-[52px] w-60 bg-gray-900 flex flex-col">
          {/* En-tête */}
          <button className="h-12 px-4 flex items-center justify-between hover:bg-gray-800 transition-colors cursor-pointer">
            <div className="flex items-center gap-1 text-gray-100">
              <span className="font-medium">Salons textuels</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <Plus className="h-4 w-4 text-gray-400 hover:text-gray-100" />
          </button>

          {/* Liste des discussions */}
          <div className="flex-1 py-2 overflow-y-auto">
            <div className="w-full">
              <div className="flex items-center gap-1.5 px-0 py-1.5 bg-gray-800 text-white cursor-pointer relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white"></div>
                <Hash className="h-5 w-5 text-gray-200 ml-4" />
                <span className="flex-1">général</span>
                <div className="hidden group-hover:flex gap-1 mr-2">
                  <button className="p-1 hover:bg-gray-700 rounded-sm">
                    <Users className="h-4 w-4" />
                  </button>
                  <button className="p-1 hover:bg-gray-700 rounded-sm">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Barre utilisateur */}
        <div className="left-0 bottom-0 h-[52px] bg-[#232428] flex items-center w-[calc(72px+240px)] z-10">
          <div className="ml-2 flex items-center justify-between w-full px-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold mr-2">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-medium">
                  {user?.email?.split("@")[0] || "Utilisateur"}
                </span>
                <span className="text-gray-400 text-xs">En ligne</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
                <Mic className="h-5 w-5" />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
                <Headphones className="h-5 w-5" />
              </button>
              <button className="p-1 text-gray-400 hover:text-gray-200 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Zone principale avec chat et liste des utilisateurs */}
      <div className="flex flex-1">
        {/* Zone principale du chat */}
        <div className="flex-1 flex flex-col">
          {/* Barre d'en-tête du canal */}
          <div className="h-12 px-4 flex items-center justify-between bg-gray-800 border-b border-gray-700 shadow-sm">
            <div className="flex items-center gap-2">
              <Hash className="h-6 w-6 text-gray-400" />
              <span className="font-medium text-white">général</span>
            </div>
            <div className="flex items-center gap-4">
              <Bell className="h-5 w-5 text-gray-400 hover:text-gray-200 cursor-pointer" />
              <Pin className="h-5 w-5 text-gray-400 hover:text-gray-200 cursor-pointer" />
              <Megaphone className="h-5 w-5 text-gray-400 hover:text-gray-200 cursor-pointer" />
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Rechercher"
                  className="bg-gray-900 text-gray-200 text-sm rounded-md px-3 py-1 pl-8 w-40 focus:outline-none focus:ring-1 focus:ring-gray-600"
                />
                <Search className="h-4 w-4 text-gray-400 absolute left-2" />
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gray-800">
            <MessageList />
          </div>

          {/* Zone de saisie du message */}
          <div className="px-4 py-3 bg-gray-800">{user && <MessageForm />}</div>
        </div>

        {/* Barre latérale droite - Liste des utilisateurs */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <UserList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
