export default function (userController) {
  const GET = (req, res, next) => userController.getUsers(req, res).catch(next);
  GET.apiDoc = {
    summary: 'List users',
    operationId: 'getUsers',
    tags: ['users'],
    responses: { 200: { description: 'List of users' } }
  };
  const POST = (req, res, next) => userController.createUser(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Create user',
    operationId: 'createUser',
    tags: ['users'],
    requestBody: { content: { 'application/json': { schema: { type: 'object' } } } },
    responses: { 200: { description: 'Created' }, 400: { description: 'Bad request' } }
  };
  return { GET, POST };
}
