import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";

type User = {
  id: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  isAuthenticated: boolean;
  updateUserId: (oldId: string, newId: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté (dans le localStorage)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Fonction pour mettre à jour l'ID de l'utilisateur lorsque le serveur indique que l'ID est différent
  const updateUserId = (oldId: string, newId: string) => {
    if (user && user.id === oldId) {
      const updatedUser = {
        ...user,
        id: newId,
      };

      // Mettre à jour l'utilisateur dans le state et localStorage
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));

      // Mettre à jour aussi dans le dictionnaire d'utilisateurs
      const allUsers = localStorage.getItem("allUsers")
        ? JSON.parse(localStorage.getItem("allUsers") || "{}")
        : {};

      if (allUsers[user.email] === oldId) {
        allUsers[user.email] = newId;
        localStorage.setItem("allUsers", JSON.stringify(allUsers));
      }

      console.log(`ID utilisateur mis à jour: ${oldId} -> ${newId}`);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Pour l'instant, nous simulons une connexion réussie sans vérification réelle
    // Dans une véritable application, vous feriez une requête à votre API avec email et password

    // Simuler un délai de connexion
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Utilisation du mot de passe sans effet réel (juste pour éviter l'erreur de linter)
    console.log(
      `Tentative de connexion avec le mot de passe: ${password.length} caractères`
    );

    // Vérifier si l'utilisateur s'est déjà connecté avec cet email
    const allUsers = localStorage.getItem("allUsers")
      ? JSON.parse(localStorage.getItem("allUsers") || "{}")
      : {};

    let userId = "";
    // Si l'utilisateur existe déjà, récupérer son ID
    if (allUsers[email]) {
      userId = allUsers[email];
    } else {
      // Sinon, créer un nouvel ID
      userId = Math.random().toString(36).substring(2, 9);
      // Enregistrer l'association email -> id
      allUsers[email] = userId;
      localStorage.setItem("allUsers", JSON.stringify(allUsers));
    }

    const newUser = {
      id: userId,
      email,
    };

    // Enregistrer l'utilisateur dans le localStorage pour persistance entre les rafraîchissements
    localStorage.setItem("user", JSON.stringify(newUser));

    // Stockons aussi un token, même simulé, pour s'assurer que l'authentification est conservée
    const fakeToken = Math.random().toString(36).substring(2);
    localStorage.setItem("token", fakeToken);

    setUser(newUser);
    setIsAuthenticated(true);
    navigate("/chat");
  };

  const signOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    navigate("/signin");
  };

  if (isLoading) {
    // Pendant que nous vérifions si l'utilisateur est authentifié, nous affichons rien
    return null;
  }

  return (
    <AuthContext.Provider
      value={{ user, signIn, signOut, isAuthenticated, updateUserId }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé avec un AuthProvider");
  }
  return context;
};
