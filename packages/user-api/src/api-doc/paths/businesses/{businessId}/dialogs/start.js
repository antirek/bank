export default function (dialogController, authenticate) {
  const POST = (req, res, next) => dialogController.startDialog(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Start dialog with business',
    operationId: 'startDialog',
    tags: ['dialogs'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Dialog started' }, 401: { description: 'Unauthorized' } }
  };
  return { POST };
}
