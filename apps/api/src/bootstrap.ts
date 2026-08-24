import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import helmet from 'helmet';
import { AppModule } from './app.module';

function configuredOrigins() {
  return [
    ...(process.env.WEB_ORIGIN ?? 'http://localhost:3000').split(','),
    process.env.URL,
  ]
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin));
}

function isNetlifyDeployOrigin(origin: string) {
  const siteName = process.env.SITE_NAME;
  if (!siteName) return false;

  try {
    const url = new URL(origin);
    return (
      url.protocol === 'https:' &&
      (url.hostname === `${siteName}.netlify.app` ||
        url.hostname.endsWith(`--${siteName}.netlify.app`))
    );
  } catch {
    return false;
  }
}

export async function createApiApplication() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter());
  const allowedOrigins = configuredOrigins();
  const corsOrigin: CustomOrigin = (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      isNetlifyDeployOrigin(origin)
    ) {
      callback(null, true);
      return;
    }
    callback(new Error('Origem não permitida pelo CORS.'));
  };

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  return app;
}
