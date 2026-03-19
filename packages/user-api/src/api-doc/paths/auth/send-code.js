export default function (authController) {
  const POST = (req, res, next) => authController.sendCode(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Send SMS code',
    operationId: 'sendCode',
    tags: ['auth'],
    requestBody: {
      content: {
        'application/json': {
          schema: { type: 'object', properties: { phone: { type: 'string' } }, required: ['phone'] }
        }
      }
    },
    responses: {
      200: { description: 'Code sent' },
      400: { description: 'Bad request' }
    }
  };
  return { POST };
}
