export default function () {
  const GET = (req, res) => {
    res.json({ status: 'ok', message: 'Bank API is running' });
  };
  GET.apiDoc = {
    summary: 'Health check',
    operationId: 'getHealth',
    tags: ['health'],
    responses: {
      200: { description: 'API is running' }
    }
  };
  return { GET };
}
