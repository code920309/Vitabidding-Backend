// src/main.js
import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOption, getNestOptions } from './app.options';
import { ConfigService } from '@nestjs/config';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { setSwagger } from './app.swagger';
import { BusinessExceptionFilter } from './exception';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule, getNestOptions());
  app.useGlobalFilters(new BusinessExceptionFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT');
  const env = configService.get<string>('SERVER_RUNTIME');
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME');

  const keyPath = path.join(__dirname, '..', 'key.pem');
  const certPath = path.join(__dirname, '..', 'cert.pem');

  setSwagger(app);
  app.enableCors(corsOption(env));

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    // SSL 키와 인증서 파일을 읽음
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    await app.init();
    https
      .createServer(httpsOptions, app.getHttpAdapter().getInstance())
      .listen(port);
    console.log(
      `✅ HTTPS server running on\n✅ runtime: ${env}\n✅ port: ${port}\n✅ serviceName: ${serviceName}`,
    );
  } else {
    await app.listen(port);
    console.log(
      `✅ HTTP server running on\n✅ runtime: ${env}\n✅ port: ${port}\n✅ serviceName: ${serviceName}`,
    );
  }
}

bootstrap();
