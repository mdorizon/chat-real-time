import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Injectable } from '@nestjs/common';

type ClientType = {
  clientId: string;
  user: UserType;
  connected: boolean;
  lastConnected: Date;
};

type UserType = {
  id: string;
  email: string;
};

interface CustomSocket extends Socket {
  data: {
    userId?: string;
  };
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messagesService: MessagesService) {}

  public connectedClients: ClientType[] = [];

  @SubscribeMessage('messageFromClient')
  async handleMessage(client: CustomSocket, message: string): Promise<void> {
    // Trouver le client connecté avec son statut de connexion
    const connectedClient = this.connectedClients.find(
      (c) => c.clientId === client.id,
    );

    // Créer l'objet message avec les informations de l'utilisateur
    const messageToSend = {
      text: message,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
      user: connectedClient
        ? {
            ...connectedClient.user,
            connected: connectedClient.connected,
          }
        : undefined,
    };

    // Envoyer immédiatement le message via WebSocket
    this.server.emit('messageFromServer', messageToSend);

    // Puis sauvegarder en DB de manière asynchrone
    if (client.data.userId) {
      try {
        await this.messagesService.create(
          { text: message } as CreateMessageDto,
          client.data.userId,
        );
      } catch (error: unknown) {
        // Notifier uniquement le client en cas d'erreur de sauvegarde
        client.emit('messageError', {
          error: "Le message n'a pas pu être sauvegardé",
          details: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }
  }

  @SubscribeMessage('toggleLike')
  async handleToggleLike(
    client: CustomSocket,
    payload: { messageId: string },
  ): Promise<void> {
    if (!client.data.userId) {
      client.emit('likeError', {
        error: 'Vous devez être connecté pour liker un message',
      });
      return;
    }

    try {
      console.log(
        'Toggling like for message:',
        payload.messageId,
        'by user:',
        client.data.userId,
      );
      const updatedMessage = await this.messagesService.toggleLike(
        payload.messageId,
        client.data.userId,
      );
      console.log('Updated message:', updatedMessage);

      // Émettre la mise à jour à tous les clients
      this.server.emit('messageLikeUpdate', {
        messageId: updatedMessage.id,
        likes: updatedMessage.likes,
        likedBy: updatedMessage.likedBy,
      });
    } catch (error: unknown) {
      console.error('Error toggling like:', error);
      client.emit('likeError', {
        error: "Le like n'a pas pu être enregistré",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  @SubscribeMessage('clientConnected')
  handleClientConnected(client: CustomSocket, user: UserType): void {
    const existingUserIndex = this.connectedClients.findIndex(
      (clientObj) => clientObj.user.id === user.id,
    );

    if (existingUserIndex !== -1) {
      this.connectedClients[existingUserIndex] = {
        clientId: client.id,
        user: user,
        connected: true,
        lastConnected: new Date(),
      };
    } else {
      this.connectedClients.push({
        clientId: client.id,
        user: user,
        connected: true,
        lastConnected: new Date(),
      });
    }

    // Stocker l'userId dans les données du socket
    client.data.userId = user.id;
    this.server.emit('connectedClients', this.connectedClients);
  }

  handleDisconnect(client: Socket): void {
    const clientIndex = this.connectedClients.findIndex(
      (clientObj) => clientObj.clientId === client.id,
    );

    if (clientIndex !== -1) {
      this.connectedClients[clientIndex].connected = false;
      this.connectedClients[clientIndex].lastConnected = new Date();
    }

    this.server.emit('connectedClients', this.connectedClients);
  }
}
