import { Controller, Post, Body } from '@nestjs/common';
import { OpenaiService } from './openai.service';

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Post('chat')
  async chat(@Body('prompt') prompt: string) {
    const respuesta = await this.openaiService.generarTexto(prompt);
    return { respuesta };
  }
}
