import cookie from 'cookie';
import isObject from 'lodash/isObject';
import { guestUser, isAdmin, isSignedIn } from './sharedUtils';
import {
  IHandler,
  IMixHandler,
  INullable,
  IObjection,
  ISwitchHttpMethod,
  IUserClass,
  IValidateFn,
} from './types';

export * from './sharedUtils';

export const switchHttpMethod: ISwitchHttpMethod = methods => async (req, res) => {
  const requestMethod = req.method?.toLowerCase() || '';
  if (!methods.hasOwnProperty(requestMethod)) return res.status(404).json({ message: 'Not Found' });

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
    if (isObject(result)) {
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

  return e.message; // TODO: no object?
};

export const validate: IValidateFn =
  (schema, payloadType = 'body') =>
  async (req, res) => {
    const payload = payloadType === 'query' ? req.query : req.body;

    try {
      const validatedBody = schema.validateSync(payload, {
        abortEarly: false,
        stripUnknown: true,
      });
      return { [payloadType]: validatedBody };
    } catch (e) {
      res.status(400).json({ message: 'Input is not valid', errors: getYupErrors(e) });
    }
  };

export const makeErrors = obj => ({ errors: obj });

export const makeSignature = (keygrip, cookieName, cookieValue) => {
  return keygrip.sign(`${cookieName}=${cookieValue}`);
};

export const verifySignature = (keygrip, cookieName, cookieValue, signature) => {
  return keygrip.verify(`${cookieName}=${cookieValue}`, signature);
};

export const setCookie = (res, keygrip, cookieName, cookieValue) => {
  const signature = makeSignature(keygrip, cookieName, cookieValue);
  res.setHeader('Set-Cookie', [
    cookie.serialize(cookieName, cookieValue, { path: '/', httpOnly: true }),
    cookie.serialize(`${cookieName}Sig`, signature, { path: '/', httpOnly: true }),
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

  const isSignatureCorrect = verifySignature(keygrip, 'userId', userId, userIdSig);
  if (isSignatureCorrect) {
    const user = await User.query().findById(userId).withGraphFetched('avatar');
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

export const checkSignedIn = async (req, res, ctx) => {
  if (!isSignedIn(ctx.currentUser)) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const getCurrentUser = (objection: IObjection, keygrip) => async (req, res) => {
  const { User } = objection;
  const currentUser = await getUserFromRequest(res, req.cookies, keygrip, User);
  return { currentUser };
};

export const waitForSocketState = async (socket, state) => {
  while (socket.readyState !== state) {
    await new Promise(resolve => setTimeout(resolve, 333));
  }
};

// not including "n"
export const getRandomNumUpTo = n => Math.floor(Math.random() * n);

export const findKeyByValue = <K, V>(map: Map<K, V>, value: V): K | null => {
  let key = null as any;
  for (const [mapKey, mapValue] of map) {
    if (mapValue === value) {
      key = mapKey;
      break;
    }
  }
  return key;
};
