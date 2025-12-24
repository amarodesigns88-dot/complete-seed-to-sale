import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe with transform and whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have decorators
      transform: true, // Automatically transform payloads to DTO instances
      forbidNonWhitelisted: true, // Optional: throw error on unknown properties
    }),
  );

  // Swagger config with bearer auth support
  const config = new DocumentBuilder()
    .setTitle('Seed to Sale API')
    .setDescription('API documentation for Seed to Sale system')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'bearer', // This name should match the security name used in @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Optionally save the spec to a file (JSON format)
  // Ensure docs directory exists
  try {
    const docsDir = './docs';
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
    fs.writeFileSync('./docs/api-spec.json', JSON.stringify(document, null, 2));
    console.log('API spec saved to ./docs/api-spec.json');
  } catch (error) {
    console.error('Failed to save API spec:', error);
    // Non-critical error, continue bootstrapping
  }

  await app.listen(3000);
}
bootstrap();