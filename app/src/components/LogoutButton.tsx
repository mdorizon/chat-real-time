import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const { signOut } = useAuth();

  return (
    <button
      onClick={signOut}
      className="p-2 text-gray-400 hover:text-gray-100 transition-colors duration-200"
      title="Se déconnecter"
    >
      <LogOut className="h-5 w-5" />
    </button>
  );
};

export default LogoutButton;
