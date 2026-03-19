export default function (subscriptionController, authenticate) {
  const GET = (req, res, next) => subscriptionController.getBusinessSubscribers(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get business subscribers',
    operationId: 'getBusinessSubscribers',
    tags: ['subscriptions'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'businessId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'List of subscribers' }, 401: { description: 'Unauthorized' } }
  };
  return { GET };
}
