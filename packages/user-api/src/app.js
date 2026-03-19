import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { initialize } from 'express-openapi';
import apiDoc from './api-doc/api-doc.js';
import { authenticate } from './middleware/auth.js';
import * as authController from './controllers/authController.js';
import * as userController from './controllers/userController.js';
import * as businessController from './controllers/businessController.js';
import * as dialogController from './controllers/dialogController.js';
import * as newsController from './controllers/newsController.js';
import * as subscriptionController from './controllers/subscriptionController.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// В production отдаём собранный frontend (SPA)
const staticDir = path.join(__dirname, '../public');
if (process.env.NODE_ENV === 'production' && existsSync(staticDir)) {
  app.use(express.static(staticDir));
}

const startServer = async () => {
  try {
    await connectDB();
    const pathsDir = path.join(__dirname, 'api-doc/paths');
    await initialize({
      app,
      apiDoc,
      paths: pathsDir,
      dependencies: {
        authController,
        userController,
        businessController,
        dialogController,
        newsController,
        subscriptionController,
        authenticate
      },
      docsPath: '/api-docs',
      exposeApiDocs: true,
      validateApiDoc: false
    });
    // Error handling and 404 must be after routes
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
    app.use((req, res) => {
      // SPA fallback: в production отдаём index.html для клиентских маршрутов
      if (process.env.NODE_ENV === 'production' && existsSync(staticDir)) {
        const indexHtml = path.join(staticDir, 'index.html');
        if (existsSync(indexHtml)) {
          return res.sendFile(indexHtml);
        }
      }
      res.status(404).json({ error: 'Route not found' });
    });
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`OpenAPI spec: http://localhost:${PORT}/api/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
