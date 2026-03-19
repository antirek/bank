export default function (subscriptionController, authenticate) {
  const POST = (req, res, next) => subscriptionController.subscribeToBusiness(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Subscribe to business',
    operationId: 'subscribeToBusiness',
    tags: ['subscriptions'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Subscribed' }, 401: { description: 'Unauthorized' } }
  };
  const DELETE = (req, res, next) => subscriptionController.unsubscribeFromBusiness(req, res).catch(next);
  DELETE.apiDoc = {
    summary: 'Unsubscribe from business',
    operationId: 'unsubscribeFromBusiness',
    tags: ['subscriptions'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Unsubscribed' }, 401: { description: 'Unauthorized' } }
  };
  return { POST, DELETE };
}
