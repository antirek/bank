export default function (dialogController, authenticate) {
  const GET = (req, res, next) => dialogController.getMyDialogs(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get my dialogs',
    operationId: 'getMyDialogs',
    tags: ['dialogs'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    responses: { 200: { description: 'List of dialogs' }, 401: { description: 'Unauthorized' } }
  };
  return { GET };
}
