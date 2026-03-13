import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

const openApiPath = path.join(__dirname, '../../openapi.yaml');
const openApiDocument = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as swaggerUi.JsonObject;

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Training Scheduler API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
};

export const swaggerUiSetup = swaggerUi.setup(openApiDocument, swaggerUiOptions);
export const swaggerUiServe = swaggerUi.serve;
