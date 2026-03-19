export default function (newsController, authenticate) {
  const GET = (req, res, next) => newsController.getUserNewsFeed(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get user news feed',
    operationId: 'getUserNewsFeed',
    tags: ['users'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'News feed' }, 401: { description: 'Unauthorized' } }
  };
  return { GET };
}
