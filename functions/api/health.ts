import worker, { Env } from '../../src/worker';

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  return worker.fetch(context.request, context.env);
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
