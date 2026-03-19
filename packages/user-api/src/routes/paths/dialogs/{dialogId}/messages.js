export default function (dialogController, authenticate) {
  const GET = (req, res, next) => dialogController.getDialogMessages(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get dialog messages',
    operationId: 'getDialogMessages',
    tags: ['dialogs'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'dialogId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'List of messages' }, 401: { description: 'Unauthorized' } }
  };
  const POST = (req, res, next) => dialogController.sendMessage(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Send message',
    operationId: 'sendMessage',
    tags: ['dialogs'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'dialogId', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Message sent' }, 401: { description: 'Unauthorized' } }
  };
  return { GET, POST };
}
