export default function (userController, authenticate) {
  const GET = (req, res, next) => userController.getUserById(req, res).catch(next);
  GET.apiDoc = {
    summary: 'Get user by ID',
    operationId: 'getUserById',
    tags: ['users'],
    parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
    responses: { 200: { description: 'User' }, 404: { description: 'Not found' } }
  };
  const PUT = (req, res, next) => userController.updateUser(req, res).catch(next);
  PUT.apiDoc = {
    summary: 'Update user',
    operationId: 'updateUser',
    tags: ['users'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Updated' }, 401: { description: 'Unauthorized' } }
  };
  return { GET, PUT };
}
