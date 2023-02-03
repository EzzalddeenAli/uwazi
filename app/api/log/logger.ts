import { tenants } from 'api/tenants';
import { appContext } from 'api/utils/AppContext';
import { createLogger, format, transports } from 'winston';

const addTenant = format(info => {
  try {
    // eslint-disable-next-line no-param-reassign
    info.tenant = tenants.current().name;
  } catch (err) {
    // eslint-disable-next-line no-param-reassign
    info.tenant = err.stack;
  }
  return info;
});

const addRequestId = format(info => {
  try {
    // eslint-disable-next-line no-param-reassign
    info.requestId = appContext.get('requestId');
  } catch (err) {
    // eslint-disable-next-line no-param-reassign
    info.requestId = err.stack;
  }
  return info;
});

const logger = createLogger({
  format: format.combine(
    addTenant(),
    addRequestId(),
    format.errors({ stack: true }), // <-- use errors format
    format.timestamp(),
    format.prettyPrint()
  ),
  transports: [new transports.Console()],
});

// logger.error(new Error('this is an error'));

export { logger };
