const winston = require('winston');
const { LEVEL } = require('triple-beam');
const expressWinston = require('express-winston');
const _ = require('lodash');

/*
 * Refer to the logging standard:
 * https://rupeek.atlassian.net/wiki/spaces/A2/pages/2212921385/Standard+Logging+Format
 *
 * We must reshape Winston's `info` object to the desired format:
 * { "rpk":
 *   {
 *    "log" : { ... }, <- nest some top-level keys under the "log" key
 *    "req" : { ... }, <- move request info up, from inside of `meta`
 *    "res" : { ... }  <- move response info up, from inside of `meta`
 *   }
 * }
 *
 * As we process the `info` object, we also clean up redundant and/or sensitive
 * information at each step. This is done by custom Winston formatters, where
 * each formatter is responsible for one part of the final payload.
 */

//
// CUSTOM FORMATTERS
//

/**
 A custom formatter that adds standard information about the log payload itself.
 Always sequence this early in the chain of custom formatters, to make log type
 info available for later formatters.
*/
const commonLogInfoFormatter = winston.format((info, options) => {
  const topLevelKeysToRemapWhenPresent = [
    'level', 'timestamp', 'message', 'line', 'file', 'threadID',
  ];

  const logInfoToNest = _.chain(info)
    .pick(topLevelKeysToRemapWhenPresent)
    .merge({ type: options.type })
    .value();

  return _.chain(info)
    .merge({ log: logInfoToNest })
    .omit(topLevelKeysToRemapWhenPresent)
    .value();
});

/**
 A custom formatter that lifts up request and response information from
 under the `meta` key, and puts it at the top level of the info object.
 Before returning the updated info object, we also clean up sensitive keys
 from the request part, and we remove the now-redundant meta map.
 */
const middlewareRequestResponseFormatter = winston.format((info) => (
  _.chain(info)
    .merge(
      {
        req: _.get(info, 'meta.req'),
        res: _.get(info, 'meta.res'),
      },
    )
    .omit([ // remove sensitive as well as unnecessary or redundant info
      'meta',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["x-auth-token"]',
      'req.headers["x-consumer-profile"]',
    ])
    .value()
));

/**
 A custom formatter to package the fully-processed info object into
 the 'rpk' log object expected by our logging standard.
 We must sequence this formatter toward the very end of the chain of
 custom formatters, just before writing out the log as JSON.
 */
const packageAsRpkPayloadFormatter = winston.format((info) => ({
  [LEVEL]: info[LEVEL], // ensure we return a proper Winston info object
  rpk: info,
}));

//
// MIDDLEWARE LOGGER
//

exports.middlewareLogger = expressWinston.logger({
  format: winston.format.combine(
    winston.format.timestamp(),
    commonLogInfoFormatter({ type: 'access' }), // always do at beginning
    middlewareRequestResponseFormatter(),
    packageAsRpkPayloadFormatter(), // always do toward end
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
  ],
  expressFormat: true,
  requestWhitelist: [...expressWinston.requestWhitelist, 'body'],
  responseWhitelist: [...expressWinston.responseWhitelist, 'body'],
});

//
// APPLICATION LOGGER
//

exports.logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    commonLogInfoFormatter({ type: 'app' }), // always do at beginning
    packageAsRpkPayloadFormatter(), // always do toward end
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
  ],
});