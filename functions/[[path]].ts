import worker, { Env } from '../src/worker';

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}): Promise<Response> {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api/')) {
    return worker.fetch(context.request, context.env);
  }
  return context.next();
}
