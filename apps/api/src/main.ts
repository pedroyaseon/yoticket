import { createApiApplication } from './bootstrap';

async function bootstrap() {
  const app = await createApiApplication();
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
