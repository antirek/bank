export default function (dialogController, authenticate) {
  const GET = (req, res, next) => dialogController.getDialog(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get dialog by ID',
    operationId: 'getDialog',
    tags: ['dialogs'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'dialogId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Dialog' }, 401: { description: 'Unauthorized' } }
  };
  return { GET };
}
