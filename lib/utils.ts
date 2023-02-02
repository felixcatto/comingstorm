import cookie from 'cookie';
import { NextApiRequest, NextApiResponse } from 'next';
import { IUserClass } from '../models';
import { guestUser, isAdmin, isSignedIn } from './sharedUtils';

export * from './sharedUtils';

type IHandler = (req: NextApiRequest, res: NextApiResponse, ctx: any) => object | void;
type IMixHandler = IHandler | IHandler[];
type IHttpMethods = {
  preHandler?: IMixHandler;
  get?: IMixHandler;
  post?: IMixHandler;
  put?: IMixHandler;
  delete?: IMixHandler;
};
export type IValidate<T> = {
  body: T;
};
export type INullable<T> = T | null;

export const switchHttpMethod =
  (methods: IHttpMethods) => async (req: NextApiRequest, res: NextApiResponse) => {
    const requestMethod = req.method?.toLowerCase() || '';
    if (!methods.hasOwnProperty(requestMethod))
      return res.status(404).json({ message: 'Not Found' });

    const handlers: IHandler[] = [];
    if (methods.preHandler) {
      if (typeof methods.preHandler === 'function') {
        handlers.push(methods.preHandler);
      } else {
        handlers.push(...methods.preHandler);
      }
    }

    const mixHandler: IMixHandler = methods[requestMethod];
    if (typeof mixHandler === 'function') {
      handlers.push(mixHandler);
    } else {
      handlers.push(...mixHandler);
    }

    let i = 0;
    let ctx = {} as any;
    while (!res.writableEnded && i < handlers.length) {
      const currentMiddleware = handlers[i];
      const result = await currentMiddleware(req, res, ctx);
      i += 1;
      if (result) {
        ctx = { ...ctx, ...result };
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
      const validatedBody = schema.validateSync(payload, {
        abortEarly: false,
        stripUnknown: true,
      });
      return { body: validatedBody };
    } catch (e) {
      res.status(400).json({ message: 'Input is not valid', errors: getYupErrors(e) });
    }
  };

export const setCookie = (res, keygrip, cookieName, cookieValue) => {
  const cookieSigName = `${cookieName}Sig`;
  const cookieSignature = keygrip.sign(`${cookieName}=${cookieValue}`);
  res.setHeader('Set-Cookie', [
    cookie.serialize(cookieName, cookieValue, { path: '/', httpOnly: true }),
    cookie.serialize(cookieSigName, cookieSignature, { path: '/', httpOnly: true }),
  ]);
};

export const removeCookie = (res, cookieName) => {
  res.setHeader('Set-Cookie', [
    cookie.serialize(cookieName, '', { path: '/', httpOnly: true, maxAge: 0 }),
    cookie.serialize(`${cookieName}Sig`, '', { path: '/', httpOnly: true, maxAge: 0 }),
  ]);
};

export const getUserFromRequest = async (res, cookies, keygrip, User: IUserClass) => {
  const { userId, userIdSig } = cookies;
  if (!userId || !userIdSig) return guestUser;

  const usedIdCookie = `userId=${userId}`;
  const isSignatureCorrect = keygrip.verify(usedIdCookie, userIdSig);
  if (isSignatureCorrect) {
    const user = await User.query().findById(userId);
    return user || guestUser;
  } else {
    removeCookie(res, 'userId');
    return guestUser;
  }
};

export const checkValueUnique = async (
  Enitity,
  column,
  value,
  excludeId: INullable<string> = null
) => {
  const existingEntities = await Enitity.query().select(column).whereNot('id', excludeId);
  if (existingEntities.some(entity => entity[column] === value)) {
    return {
      isUnique: false,
      errors: { [column]: `${column} should be unique` },
    };
  }

  return { isUnique: true, errors: null };
};

export const checkAdmin = async (req, res, ctx) => {
  if (!isAdmin(ctx.currentUser)) {
    res.status(403).json({ message: 'Forbidden' });
  }
};

// export const checkBelongsToUser = getResourceAuthorId => async (request, reply) => {
//   const resourceAuthorId = await getResourceAuthorId(request);
//   if (!isBelongsToUser(request.currentUser)(resourceAuthorId)) {
//     reply.code(403).send({ message: 'Forbidden' });
//   }
// };

export const checkSignedIn = async (req, res, ctx) => {
  if (!isSignedIn(ctx.currentUser)) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const getCurrentUser = (objection, keygrip) => async (req, res) => {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return { currentUser };
};
