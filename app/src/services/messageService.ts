import axios from "axios";
import { authService } from "./authService";

const API_URL = "http://localhost:8000/api/messages";

export interface Message {
  id: string;
  text: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
  user: {
    id: string;
    email: string;
  };
}

export interface CreateMessageDto {
  text: string;
  user?: {
    id: string;
    email: string;
  };
}

export const messageService = {
  async create(data: CreateMessageDto): Promise<Message> {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const storedUser = localStorage.getItem("user");
    const userData = storedUser ? JSON.parse(storedUser) : null;

    // Ajouter l'utilisateur au corps de la requête
    const messageData = {
      ...data,
      user: userData,
    };

    // Envoyer la requête sans en-tête d'autorisation
    const response = await axios.post(API_URL, messageData);
    return response.data;
  },

  async findAll(): Promise<Message[]> {
    const response = await axios.get(API_URL);
    return response.data;
  },

  async findOne(id: string): Promise<Message> {
    const token = authService.getToken();
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async update(id: string, data: CreateMessageDto): Promise<Message> {
    const token = authService.getToken();
    const response = await axios.patch(`${API_URL}/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  async remove(id: string): Promise<void> {
    const token = authService.getToken();
    await axios.delete(`${API_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
