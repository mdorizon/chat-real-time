import React, { useEffect, useState } from "react";
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
          placeholder="Type your message..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />

        <button
          type="submit"
          disabled={mutation.isPending || !allowToSend}
          className={`absolute right-0 top-0 bottom-0 rounded-r-lg bg-indigo-500 px-4 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-300 cursor-pointer ${
            allowToSend ? "opacity-100" : "opacity-0"
          }`}
        >
          {mutation.isPending ? "Sending..." : <SendHorizontal />}
        </button>
      </div>
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-600">
          Error sending message. Please try again.
        </p>
      )}
    </form>
  );
};

export default MessageForm;
