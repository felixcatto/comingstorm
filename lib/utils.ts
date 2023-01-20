import type { NextApiRequest, NextApiResponse } from 'next';

export * from './sharedUtils';

type IHandler = (req: NextApiRequest, res: NextApiResponse) => void;
type IMixHandler = IHandler | IHandler[];
type IHttpMethods = {
  get?: IMixHandler;
  post?: IMixHandler;
  put?: IMixHandler;
  delete?: IMixHandler;
};

export const switchHttpMethod =
  (methods: IHttpMethods) => async (req: NextApiRequest, res: NextApiResponse) => {
    const requestMethod = req.method?.toLowerCase() || '';
    if (!methods.hasOwnProperty(requestMethod))
      return res.status(404).json({ message: 'Not Found' });
    const mixHandler: IMixHandler = methods[requestMethod];
    if (typeof mixHandler === 'function') {
      mixHandler(req, res);
    } else {
      let i = 0;
      let currentMiddleware = mixHandler[i];
      while (!res.writableEnded && currentMiddleware) {
        await currentMiddleware(req, res);
        i += 1;
        currentMiddleware = mixHandler[i];
      }
    }
  };

const getYupErrors = e => {
  if (e.inner) {
    return e.inner.reduce(
      (acc, el) => ({
        ...acc,
        [el.path]: el.message,
      }),
      {}
    );
  }

  return e.message; // no object?
};

export const validate =
  (schema, payloadType = 'body') =>
  async (req, res) => {
    const payload = payloadType === 'query' ? req.query : req.body;

    try {
      req.data = schema.validateSync(payload, {
        abortEarly: false,
        stripUnknown: true,
      });
    } catch (e) {
      res.status(400).json({ message: 'Input is not valid', errors: getYupErrors(e) });
    }
  };
