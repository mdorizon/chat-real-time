import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Bot } from "lucide-react";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      setIsLoading(true);
      await signIn(email, password);
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Identifiants incorrects. Veuillez réessayer.");
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
            Bon retour parmi nous !
          </h1>
          <p className="text-gray-400 text-center">
            Nous sommes si heureux de vous revoir !
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

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-sm text-gray-400">
          <span>Besoin d'un compte ?</span>{" "}
          <Link to="/signup" className="text-indigo-400 hover:underline">
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
