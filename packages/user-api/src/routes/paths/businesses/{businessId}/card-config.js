export default function (businessController, authenticate) {
  const GET = (req, res, next) => businessController.getCardConfig(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get business card config',
    operationId: 'getCardConfig',
    tags: ['businesses'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Card config' }, 401: { description: 'Unauthorized' } }
  };

  const PUT = (req, res, next) => businessController.updateCardConfig(req, res).catch(next);
  PUT.apiDoc = {
    summary: 'Update business card config',
    operationId: 'updateCardConfig',
    tags: ['businesses'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Updated card config' }, 401: { description: 'Unauthorized' } }
  };

  return { GET, PUT };
}
