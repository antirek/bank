export default function (dialogController, authenticate) {
  const GET = (req, res, next) => dialogController.getBusinessDialogs(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get business dialogs',
    operationId: 'getBusinessDialogs',
    tags: ['dialogs'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'List of dialogs' }, 401: { description: 'Unauthorized' } }
  };
  return { GET };
}
