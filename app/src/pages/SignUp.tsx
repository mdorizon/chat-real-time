import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bot } from "lucide-react";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setIsLoading(true);
      // En réalité, nous devrions avoir un service d'inscription
      // Pour ce prototype, nous utilisons directement signIn
      await signIn(email, password);
      navigate("/chat");
    } catch (err) {
      console.error("Erreur d'inscription:", err);
      setError("Erreur lors de l'inscription. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#313338]">
      <div className="w-full max-w-md bg-[#1E1F22] rounded-md p-8 shadow-xl">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <Bot className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-lg font-bold text-white mb-1 text-center leading-tight">
            Créer un compte
          </h1>
          <p className="text-gray-400 text-center">
            Rejoignez la communauté chat en temps réel
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase text-gray-400">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#313338] border border-[#232428] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="exemple@discord.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase text-gray-400">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#313338] border border-[#232428] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase text-gray-400">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#313338] border border-[#232428] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Inscription en cours..." : "S'inscrire"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-sm text-gray-400">
          <span>Déjà un compte ?</span>{" "}
          <Link to="/signin" className="text-indigo-400 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
