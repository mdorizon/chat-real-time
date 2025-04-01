import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  messageService,
  CreateMessageDto,
} from "../../services/messageService";
import { SendHorizontal } from "lucide-react";
import { io, Socket } from "socket.io-client";

const MessageForm: React.FC = () => {
  const { register, handleSubmit, reset, watch } = useForm<CreateMessageDto>();
  const queryClient = useQueryClient();
  const messageText = watch("text", "");
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socket = io("http://localhost:8000");
    socket.on("connect", () => {
      setSocket(socket);
    });

    socket.on("messageFromServer", () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const allowToSend = messageText.trim() !== "";

  const mutation = useMutation({
    mutationFn: (data: CreateMessageDto) => messageService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      reset();
      if (!socket) return;
      socket.emit("messageFromClient", "newMessage");
    },
  });

  const onSubmit = (data: CreateMessageDto) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <div className="flex gap-2">
        <input
          {...register("text", { required: true })}
          type="text"
          placeholder="Envoyer un message..."
          className="w-full rounded-lg bg-gray-700 border-none px-4 py-3 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <button
          type="submit"
          disabled={mutation.isPending || !allowToSend}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors duration-200 ${
            allowToSend ? "opacity-100" : "opacity-0"
          }`}
        >
          {mutation.isPending ? (
            <span className="text-sm">Envoi...</span>
          ) : (
            <SendHorizontal className="h-5 w-5" />
          )}
        </button>
      </div>
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-400">
          Erreur lors de l'envoi du message. Veuillez réessayer.
        </p>
      )}
    </form>
  );
};

export default MessageForm;
