import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AuthForm from "../components/AuthForm";
import { AuthFormData } from "../services/authService";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: AuthFormData) => {
    await signIn(data);
    navigate("/");
  };

  return (
    <AuthForm
      title="Connexion à votre compte"
      submitButtonText="Se connecter"
      onSubmit={handleSubmit}
      redirectText="Pas encore de compte ?"
      redirectLinkText="S'inscrire"
      redirectTo="/signup"
    />
  );
}
