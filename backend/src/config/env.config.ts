export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  // con MongoCompass
  mongodb: process.env.MONGODB_URI,
  // con Docker y TablePlus
  // mongodb: process.env.MONGODB,
  port: 8080,
  jwt: process.env.JWT_SECRET || 'secretkey',
  apiKey: process.env.API_KEY || 'qp-alliance-api-key-2025-default',
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
  hubspotToken: process.env.HUBSPOT_TOKEN,
});
