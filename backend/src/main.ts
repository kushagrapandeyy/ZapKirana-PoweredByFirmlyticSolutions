import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET env var is not set. Refusing to start.');
  }

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 0.1, // Adjust as needed
      profilesSampleRate: 0.1,
    });
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });
  
  app.use(helmet());
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://consumer.zapkirana.app', 'https://vendor.zapkirana.app', 'https://admin.zapkirana.app'] 
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,       // strip unknown fields
    forbidNonWhitelisted: true, // throw if unknown fields are present
    transform: true,       // auto-transform payloads to DTO instances
  }));

  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
