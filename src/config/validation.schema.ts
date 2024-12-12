// src/config/validation.schema.ts
import Joi from 'joi';

export const validationSchema = Joi.object({
  // ENV
  SERVER_RUNTIME: Joi.string().valid('local', 'test', 'prod').required(),
  SERVER_PORT: Joi.number().required(),
  SERVER_SERVICE_NAME: Joi.string().required(),

  // BACKEND
  SERVER_BASE_URL: Joi.string().required(),

  // SWAGGER
  SWAGGER_ID: Joi.string().required(),
  SWAGGER_PW: Joi.string().required(),

  // AUTH
  JWT_SECRET: Joi.string().required(),
  ACCESS_TOKEN_EXPIRY: Joi.string().required(),
  REFRESH_TOKEN_EXPIRY: Joi.string().required(),

  // DB (PostgreSQL)
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_NAME: Joi.string().required(),
  DB_ID: Joi.string().required(),
  DB_PW: Joi.string().required(),

  // database (Redis)
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),
  REDIS_ID: Joi.string().required(),
  REDIS_PW: Joi.string().required(),

  // NodeMailer
  NODE_MAILER_ID: Joi.string().required(),
  NODE_MAILER_PW: Joi.string().required(),

  // Naver SMS
  NAVER_ACCESS_KEY: Joi.string().required(),
  NAVER_SECRET_KEY: Joi.string().required(),
  NAVER_SERVICE_ID: Joi.string().required(),
  NAVER_CALLER: Joi.string().required(),

  // OCI
  OCI_USER_OCID: Joi.string().required(),
  OCI_TENANCY_OCID: Joi.string().required(),
  OCI_FINGERPRINT: Joi.string().required(),
  OCI_PRIVATE_KEY_PATH: Joi.string().required(),
  OCI_REGION: Joi.string().required(),
  OCI_BUCKET_NAME: Joi.string().required(),
  OCI_NAMESPACE: Joi.string().required(),
  OCI_CONFIG_FILE: Joi.string().required(),
});
