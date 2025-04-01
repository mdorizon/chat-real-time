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
        <LogIn />
        <span>Se connecter</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
          {user.email[0].toUpperCase()}
        </div>
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
      </div>
      <div className="flex flex-col">
        <span className="font-medium text-gray-900">{user.email}</span>
        <span className="text-sm text-gray-500">En ligne</span>
      </div>
    </div>
  );
};

export default UserInfo;
