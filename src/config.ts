import convict from 'convict';
import * as dotenv from 'dotenv';
const env = process.env.NODE_ENV || 'development';
dotenv.config({path: `.env.${env}`});

const config = convict({
  discordWebHook: {
    doc: '',
    format: String,
    default: '',
    env: 'DISCORD_ERROR_LOGGING_WEBHOOK',
  },
  liquibase: {
    url: {
      doc: '',
      format: String,
      default: '',
      env: 'LIQUIBASE_DB_URL',
    },
    username: {
      doc: '',
      format: String,
      default: '',
      env: 'LIQUIBASE_DB_USERNAME',
    },
    password: {
      doc: '',
      format: String,
      default: '',
      env: 'LIQUIBASE_DB_PASSWORD',
    },
    changeLogFile: {
      doc: '',
      format: String,
      default: '',
      env: 'LIQUIBASE_CHANGELOG_FILE',
    },
    logLevel: {
      doc: '',
      format: String, // "off", "severe", "warning", "info", "debug"
      default: 'info',
      env: 'LIQUIBASE_LOG_LEVEL',
    },
  },
  db: {
    url: {
      doc: '',
      format: String,
      default: '',
      env: 'DATABASE_URL',
    },
  },
  awsS3Bucket: {
    doc: '',
    format: String,
    default: '',
    env: 'S3_BUCKET',
  },
  mailService: {
    email: {
      doc: '',
      format: String,
      default: '',
      env: 'EMAIL_ADRESS',
    },
    password: {
      doc: '',
      format: String,
      default: '',
      env: 'EMAIL_PASSWORD',
    },
  },
  awsCognito: {
    userPoolId: {
      doc: '',
      format: String,
      default: '',
      env: 'AWS_USER_POOL_ID',
    },
    clientId: {
      doc: '',
      format: String,
      default: '',
      env: 'AWS_CLIENT_ID',
    },
    region: {
      doc: '',
      format: String,
      default: '',
      env: 'AWS_REGION',
    },
  },
  baseUrl: {
    doc: 'The base URL of the API',
    format: String,
    default: 'http://localhost:5000',
    env: 'API_BASE_URL',
  },
  freeStripeProducId: {
    doc: 'There is a free friends and family plan in stripe that we want to hide. To be able to filter it from the request we need the product id',
    format: String,
    default: '',
    env: 'FREE_STRIPE_PRODUCT_ID',
  },
  port: {
    doc: 'The port the API should listen on',
    format: 'port',
    default: 5000,
    nullable: true,
    env: 'PORT',
  },
  stripeSecretKey: {
    doc: 'The secret key for stripe',
    format: String,
    default: '',
    env: 'STRIPE_SECRET_KEY',
  },
});

config.validate();

export default config;
