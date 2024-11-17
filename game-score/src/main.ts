import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger' ;

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuracion basica de Swagger
  const config = new DocumentBuilder ()
  .setTitle('Game Score Api')
  .setDescription('REST API for Game Score API')
  .setVersion('1.4.15')
  .addServer('/api/v1')
  .addBearerAuth()
  .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  app.enableVersioning().setGlobalPrefix('api/v1');
  app.enableCors({origin:'*',methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',allowedHeaders: 'Content-Type, Authorization'} );
  
  await app.listen(process.env.PORT ?? 3000);

}
bootstrap();
