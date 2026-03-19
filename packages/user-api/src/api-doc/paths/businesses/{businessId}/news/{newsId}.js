export default function (newsController, authenticate) {
  const PUT = (req, res, next) => newsController.updateNews(req, res).catch(next);
  PUT.apiDoc = {
    summary: 'Update news',
    operationId: 'updateNews',
    tags: ['news'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [
      { name: 'businessId', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'newsId', in: 'path', required: true, schema: { type: 'string' } }
    ],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Updated' }, 401: { description: 'Unauthorized' } }
  };
  const DELETE = (req, res, next) => newsController.deleteNews(req, res).catch(next);
  DELETE.apiDoc = {
    summary: 'Delete news',
    operationId: 'deleteNews',
    tags: ['news'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [
      { name: 'businessId', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'newsId', in: 'path', required: true, schema: { type: 'string' } }
    ],
    responses: { 200: { description: 'Deleted' }, 401: { description: 'Unauthorized' } }
  };
  return { PUT, DELETE };
}
