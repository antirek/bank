export default function (subscriptionController, authenticate) {
  const GET = (req, res, next) => subscriptionController.getUserSubscriptions(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get my subscriptions',
    operationId: 'getUserSubscriptions',
    tags: ['subscriptions'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    responses: { 200: { description: 'List of subscriptions' }, 401: { description: 'Unauthorized' } }
  };
  return { GET };
}
