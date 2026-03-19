export default function (businessController, authenticate) {
  const GET = (req, res, next) => businessController.getBusinesses(req, res).catch(next);
  GET.apiDoc = {
    summary: 'List businesses',
    operationId: 'getBusinesses',
    tags: ['businesses'],
    responses: { 200: { description: 'List of businesses' } }
  };
  const POST = (req, res, next) => businessController.createBusiness(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Create business',
    operationId: 'createBusiness',
    tags: ['businesses'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Created' }, 401: { description: 'Unauthorized' } }
  };
  return { GET, POST };
}
