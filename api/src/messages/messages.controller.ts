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
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

interface RequestWithUser extends Request {
  user: JwtPayload;
}

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    console.log('createMessageDto : ', req.user.id);
    return this.messagesService.create(createMessageDto, req.user.id);
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
