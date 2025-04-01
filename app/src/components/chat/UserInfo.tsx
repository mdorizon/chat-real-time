import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { LogIn } from "lucide-react";

const UserInfo: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Button
        onClick={() => navigate("/signin")}
        className="w-full cursor-pointer"
      >
        <LogIn className="h-4 w-4 mr-2" />
        <span>Se connecter</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
          {user.email[0].toUpperCase()}
        </div>
        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-gray-900"></div>
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium text-gray-100 truncate">
          {user.email.split("@")[0]}
        </span>
        <span className="text-xs text-gray-400">En ligne</span>
      </div>
    </div>
  );
};

export default UserInfo;
