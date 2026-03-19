export default function (authController) {
  const POST = (req, res, next) => authController.verifyCode(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Verify SMS code',
    operationId: 'verifyCode',
    tags: ['auth'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { phone: { type: 'string' }, code: { type: 'string' } },
            required: ['phone', 'code']
          }
        }
      }
    },
    responses: {
      200: { description: 'Token and user' },
      400: { description: 'Invalid code' }
    }
  };
  return { POST };
}
