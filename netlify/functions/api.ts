import type { Handler, HandlerResponse } from "@netlify/functions";
import serverless from "serverless-http";
import { createApiApplication } from "../../apps/api/src/bootstrap";

type ServerlessHandler = ReturnType<typeof serverless>;

let handlerPromise: Promise<ServerlessHandler> | undefined;

async function createHandler(): Promise<ServerlessHandler> {
  const app = await createApiApplication();
  await app.init();
  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

async function getHandler() {
  handlerPromise ??= createHandler();
  try {
    return await handlerPromise;
  } catch (error) {
    handlerPromise = undefined;
    throw error;
  }
}

export const handler: Handler = async (event, context) => {
  const apiHandler = await getHandler();
  return (await apiHandler(event, context)) as HandlerResponse;
};
