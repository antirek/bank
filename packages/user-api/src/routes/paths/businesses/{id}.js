export default function (businessController, authenticate) {
  const GET = (req, res, next) => businessController.getBusinessById(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get business by ID',
    operationId: 'getBusinessById',
    tags: ['businesses'],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Business' }, 404: { description: 'Not found' } }
  };
  const PUT = (req, res, next) => businessController.updateBusiness(req, res).catch(next);
  PUT.apiDoc = {
    summary: 'Update business',
    operationId: 'updateBusiness',
    tags: ['businesses'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Updated' }, 401: { description: 'Unauthorized' } }
  };
  return { GET, PUT };
}
