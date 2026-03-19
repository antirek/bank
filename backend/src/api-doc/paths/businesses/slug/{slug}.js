export default function (businessController) {
  const GET = (req, res, next) => businessController.getBusinessBySlug(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get business by slug',
    operationId: 'getBusinessBySlug',
    tags: ['businesses'],
    parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'Business' }, 404: { description: 'Not found' } }
  };
  return { GET };
}
