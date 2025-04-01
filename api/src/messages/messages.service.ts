import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private usersService: UsersService,
  ) {}

  async create(
    createMessageDto: CreateMessageDto,
    userId: string,
  ): Promise<Message> {
    console.log('createMessageDto : ', createMessageDto);
    const user = await this.usersService.findOne(userId);
    const message = this.messagesRepository.create({
      ...createMessageDto,
      user,
      likes: 0,
      likedBy: [],
    });
    return this.messagesRepository.save(message);
  }

  async createAnonymous(createMessageDto: CreateMessageDto): Promise<Message> {
    console.log('createMessageDto anonyme : ', createMessageDto);

    // Si des informations utilisateur sont fournies dans le DTO
    if (createMessageDto.user && createMessageDto.user.id) {
      try {
        // Essayer de trouver l'utilisateur par ID
        const user = await this.usersService.findOne(createMessageDto.user.id);

        // Si l'utilisateur est trouvé, créer un message avec cet utilisateur
        const message = this.messagesRepository.create({
          text: createMessageDto.text,
          user,
          likes: 0,
          likedBy: [],
        });

        return this.messagesRepository.save(message);
      } catch (err) {
        console.log(
          'Utilisateur non trouvé dans la base de données, création de message sans utilisateur',
          err,
        );
      }
    }

    // Si aucune information utilisateur n'est fournie ou si l'utilisateur n'est pas trouvé
    const message = this.messagesRepository.create({
      text: createMessageDto.text,
      likes: 0,
      likedBy: [],
    });

    return this.messagesRepository.save(message);
  }

  async findAll(): Promise<Message[]> {
    return this.messagesRepository.find({
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Message> {
    const message = await this.messagesRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async update(
    id: string,
    updateMessageDto: CreateMessageDto,
  ): Promise<Message> {
    await this.findOne(id);
    await this.messagesRepository.update(id, updateMessageDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.messagesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }

  async toggleLike(messageId: string, userId: string): Promise<Message> {
    const message = await this.findOne(messageId);

    if (!message.likedBy) {
      message.likedBy = [];
    }

    const userIndex = message.likedBy.indexOf(userId);

    if (userIndex === -1) {
      // L'utilisateur n'a pas encore liké ce message
      message.likedBy.push(userId);
      message.likes += 1;
    } else {
      // L'utilisateur a déjà liké ce message, on retire son like
      message.likedBy.splice(userIndex, 1);
      message.likes -= 1;
    }

    return this.messagesRepository.save(message);
  }
}
