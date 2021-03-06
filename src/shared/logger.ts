const uuid = require('uuid');
const log4js = require('log4js');
import {Interceptor} from '@loopback/context';
import {RestBindings} from '@loopback/rest';


const sensitivePayloadAttribute = [
  'password',
  ''
];

log4js.configure({
  appenders: {cheese: {type: 'dateFile', filename: 'logs/demo.log', pattern: '.yyyy-MM-dd-hh-mm', compress: true}},
  categories: {default: {appenders: ['cheese'], level: 'debug'}}
});

const logger = log4js.getLogger(process.env.NODE_ENV);

logger.info("Application starts and running")
export const log: Interceptor = async (invocationCtx, next) => {
  // Wait until the interceptor/method chain returns
  const req = await invocationCtx.get(RestBindings.Http.REQUEST);
  const requestId = uuid.v4();
  logger.info(`request_id - ${requestId} | request_ip - ${req.ip}`);

  try {
    logger.info(`request_id - ${requestId} | STARTING - class - ${invocationCtx.targetClass.name} | method -  ${invocationCtx.methodName}`);
    const result = await next();
    const res = await invocationCtx.get(RestBindings.Http.RESPONSE);

    logger.info(`request_id- ${requestId} | ENDING - class - ${invocationCtx.targetClass.name} | method - ${invocationCtx.methodName}`);
    logger.info("response_status_code- " + res.statusCode);

    return result;
  } catch (e) {
    logger.error(`request_id- ${requestId} | ERROR - class - ${invocationCtx.targetClass.name} | method - ${invocationCtx.methodName}`);
    logger.error(e);
    throw e;
  }
};
