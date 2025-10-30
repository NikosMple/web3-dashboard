import { Request, Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Swagger config
  const config = new DocumentBuilder()
    .setTitle('Web3 Auth API')
    .setDescription('API docs for Web3 Auth Dashboard')
    .setVersion('1.0')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Serve JSON spec (used by Orval)
  app.getHttpAdapter().get('/docs-json', (req: Request, res: Response) => {
    res.json(document);
  });

  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);
  console.log(`🚀 Backend on http://localhost:${port}`);
  console.log(`📘 Swagger docs at http://localhost:${port}/docs`);
  console.log(`📄 OpenAPI JSON at http://localhost:${port}/docs-json`);
}

void bootstrap();
