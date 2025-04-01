import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { AuthFormData } from "../services/authService";
import { Button } from "./ui/button";

interface AuthFormProps {
  title: string;
  submitButtonText: string;
  onSubmit: (data: AuthFormData) => Promise<void>;
  redirectText: string;
  redirectLinkText: string;
  redirectTo: string;
}

const AuthForm: React.FC<AuthFormProps> = ({
  title,
  submitButtonText,
  onSubmit,
  redirectText,
  redirectLinkText,
  redirectTo,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>();

  const handleFormSubmit = async (data: AuthFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await onSubmit(data);
    } catch (err) {
      console.error("Authentication error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'authentification"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {title}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-6" onSubmit={handleSubmit(handleFormSubmit)}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Adresse email
            </label>
            <div className="mt-2">
              <input
                id="email"
                autoComplete="email"
                {...register("email", {
                  required: "L'email est requis",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Adresse email invalide",
                  },
                })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Mot de passe
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                type="password"
                autoComplete={
                  redirectTo === "/signin" ? "new-password" : "current-password"
                }
                {...register("password", {
                  required: "Le mot de passe est requis",
                  minLength: {
                    value: 6,
                    message:
                      "Le mot de passe doit contenir au moins 6 caractères",
                  },
                })}
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-2"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              variant="default"
              className="w-full cursor-pointer"
            >
              {isLoading ? "Chargement..." : submitButtonText}
            </Button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          {redirectText}{" "}
          <Link
            to={redirectTo}
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            {redirectLinkText}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
