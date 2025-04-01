import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

const LogoutButton: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate("/signin");
  };

  if (!user) return null;

  return (
    <Button onClick={handleLogout} variant="ghost" className="cursor-pointer">
      Déconnexion
    </Button>
  );
};

export default LogoutButton;
