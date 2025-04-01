import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Interface simplifiée pour req.user optionnel
interface RequestWithOptionalUser {
  user?: {
    id: string;
    email: string;
  };
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  async create(
    @Request() req: RequestWithOptionalUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    if (req.user) {
      console.log('Message authentifié avec userId:', req.user.id);
      return this.messagesService.create(createMessageDto, req.user.id);
    }

    console.log('Message anonyme');
    return this.messagesService.createAnonymous(createMessageDto);
  }

  @Get()
  findAll() {
    return this.messagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messagesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateMessageDto: CreateMessageDto) {
    return this.messagesService.update(id, updateMessageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.messagesService.remove(id);
  }
}
