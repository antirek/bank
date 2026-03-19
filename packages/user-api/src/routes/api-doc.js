/** @type {import('express-openapi').OpenApiDocument } */
export default {
  openapi: '3.0.0',
  info: {
    title: 'Boqq API',
    version: '1.0.0',
    description: 'Система общения бизнеса и клиентов'
  },
  servers: [{ url: '/api', description: 'API' }],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  // Отключаем валидацию запросов и ответов
  'x-express-openapi-disable-validation-middleware': true,
  'x-express-openapi-disable-response-validation-middleware': true
};
