import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'core/extensions';
import { TransformInterceptor } from 'core/interceptors';
import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      /https?:\/\/localhost:\d+/,
      /chrome-extensions?:\/\/*/
    ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
      'Origin',
      'Accept-Language',
      'Accept-Encoding',
      'x-api-key',
      'X-API-KEY',
      'X-CSRF-Token',
      'x-csrf-token',
      'Cookie',
      'cookie',
    ],
    exposedHeaders: ['Set-Cookie', 'set-cookie'],
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new TransformInterceptor());

  const documentVersion = '1.0';
  const documentBaseUrl = process.env.URL_API || '';
  const config = new DocumentBuilder()
    .setTitle('Foxia Auth API')
    .setDescription('Foxia Auth API description')
    .setVersion(documentVersion)
    .addServer(documentBaseUrl)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  try {
    await app.startAllMicroservices();
    await app.init();
    await app.listen(process.env.PORT ?? 3000);
  } catch (error) {
    console.log('e', error);
    await app.close();
  }
}
bootstrap();
