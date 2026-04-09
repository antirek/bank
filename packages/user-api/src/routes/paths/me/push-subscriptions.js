export default function (pushSubscriptionController, authenticate) {
  const POST = (req, res, next) =>
    pushSubscriptionController.registerPushSubscription(req, res).catch(next);
  POST.apiDoc = {
    summary: 'Register Web Push subscription (owner-pwa)',
    operationId: 'registerPushSubscription',
    tags: ['push'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['subscription'],
            properties: {
              client: { type: 'string', example: 'owner-pwa' },
              subscription: {
                type: 'object',
                required: ['endpoint', 'keys'],
                properties: {
                  endpoint: { type: 'string' },
                  keys: {
                    type: 'object',
                    required: ['p256dh', 'auth'],
                    properties: {
                      p256dh: { type: 'string' },
                      auth: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Registered' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' }
    }
  };

  const DELETE = (req, res, next) =>
    pushSubscriptionController.revokePushSubscription(req, res).catch(next);
  DELETE.apiDoc = {
    summary: 'Revoke Web Push subscription',
    operationId: 'revokePushSubscription',
    tags: ['push'],
    security: [{ bearerAuth: [] }],
    'x-express-openapi-additional-middleware': [authenticate],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['endpoint'],
            properties: {
              endpoint: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      204: { description: 'Removed' },
      400: { description: 'Bad request' },
      401: { description: 'Unauthorized' },
      404: { description: 'Not found' }
    }
  };

  return { POST, DELETE };
}
