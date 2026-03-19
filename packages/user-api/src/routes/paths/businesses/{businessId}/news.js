export default function (newsController, authenticate) {
  const GET = (req, res, next) => newsController.getBusinessNews(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get business news',
    operationId: 'getBusinessNews',
    tags: ['news'],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'List of news' } }
  };
  const POST = (req, res, next) => newsController.createNews(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Create news',
    operationId: 'createNews',
    tags: ['news'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Created' }, 401: { description: 'Unauthorized' } }
  };
  return { GET, POST };
}
