export default function (newsController) {
  const GET = (req, res, next) => newsController.getGlobalNewsFeed(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Global news feed (all businesses)',
    operationId: 'getGlobalNewsFeed',
    tags: ['news'],
    parameters: [
      {
        name: 'limit',
        in: 'query',
        required: false,
        schema: { type: 'integer', default: 30 }
      }
    ],
    responses: { 200: { description: 'News from all businesses, newest first' } }
  };
  return { GET };
}
