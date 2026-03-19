export default function (dialogController, authenticate) {
  const PATCH = (req, res, next) => dialogController.markAsRead(req, res).catch(next);
  PATCH.apiDoc = {
    summary: 'Mark dialog as read',
    operationId: 'markDialogAsRead',
    tags: ['dialogs'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'dialogId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Marked as read' }, 401: { description: 'Unauthorized' } }
  };
  return { PATCH };
}
