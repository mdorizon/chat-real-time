import { useAuth } from "@/contexts/AuthContext";
import MessageForm from "../components/chat/MessageForm";
import MessageList from "../components/chat/MessageList";
import UserInfo from "../components/chat/UserInfo";
import LogoutButton from "../components/LogoutButton";
import UserList from "@/components/chat/UserList";

const Chat = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto w-full h-screen">
      <div className="rounded-lg w-full h-full flex flex-col">
        {/* Header */}
        <div className="h-20 bg-white shadow-md z-50 rounded-t-lg">
          <UserList />
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList />
        </div>

        {/* Footer */}
        <div className="h-32 bg-white shadow-md z-50">
          <div className="w-full h-full p-4 gap-4 flex flex-col">
            {user && (
              <div className="flex-1">
                <MessageForm />
              </div>
            )}
            <div className="flex justify-between">
              <UserInfo />
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
