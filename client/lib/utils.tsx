import Link from 'next/link';
import { useRouter } from 'next/router';
import cn from 'classnames';
import { useFormikContext } from 'formik';
import { isFunction, omit } from 'lodash';
import { compile } from 'path-to-regexp';
import React, { useState } from 'react';
import Select from 'react-select';
import useSWROriginal, { useSWRConfig } from 'swr';
import { roles } from '../../lib/sharedUtils';
import Context from './context';
import { IEmptyObject } from '../lib/types';
import { IGetApiUrl } from './routes';
import { ISessionActions, ISessionStore } from '../common/sessionSlice';

export * from '../../lib/sharedUtils';
export { Context };

type IContext = {
  getApiUrl: IGetApiUrl;
  axios: any;
  actions: ISessionActions;
  $session: ISessionStore;
};
export type IApiErrors = {
  apiErrors: any;
  setApiErrors: any;
};

export const useContext = () => React.useContext<IContext>(Context);

export function makeUrlFor<T extends object>(rawRoutes: T) {
  const routes = Object.keys(rawRoutes).reduce(
    (acc, name) => ({ ...acc, [name]: compile(rawRoutes[name]) }),
    {} as any
  );

  return (name: keyof T, args = {}, opts = {}) => {
    const toPath = routes[name];
    return toPath(args, opts);
  };
}

export const NavLink = ({ href, children }) => {
  const router = useRouter();
  const { pathname } = router;
  const className = cn('app__nav-link', {
    'app__nav-link_active': pathname === href,
  });
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};

export const dedup = fn => {
  let isRunning = false;
  return async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      return await fn();
    } finally {
      isRunning = false;
    }
  };
};

export const userRolesToIcons = {
  [roles.admin]: 'fa fa-star',
  [roles.user]: 'fa fa-fire',
  [roles.guest]: 'fa fa-ghost',
};

export function useSWR<ResponseType = any>(url, config = {} as any) {
  // const { isFirstRender } = useContext();
  // const { fallback } = useSWRConfig();
  // const ssrData = fallback[url];
  // const revalidateOnMount = !ssrData || (ssrData && !isFirstRender.current);
  // return useSWROriginal<ResponseType>(url, { ...config, revalidateOnMount });
  return useSWROriginal<ResponseType>(url, config);
}

export const FormContext = React.createContext<IApiErrors>(null as any);

export const WithApiErrors = Component => props => {
  const [apiErrors, setApiErrors] = React.useState({});
  return (
    <FormContext.Provider value={{ apiErrors, setApiErrors }}>
      <Component {...props} apiErrors={apiErrors} setApiErrors={setApiErrors} />
    </FormContext.Provider>
  );
};

export const ErrorMessage = ({ name }) => {
  const { apiErrors } = React.useContext(FormContext);
  const error = apiErrors[name];
  return error ? <div className="error">{error}</div> : null;
};

export const Field = props => {
  const { apiErrors, setApiErrors } = React.useContext(FormContext) as any;
  const { values, handleBlur: onBlur, handleChange }: any = useFormikContext();
  const value = values[props.name];
  const { as, children, ...restProps } = props;
  const asElement = as || 'input';
  const onChange = e => {
    setApiErrors(omit(apiErrors, e.target.name));
    handleChange(e);
  };

  return React.createElement(asElement, { ...restProps, onChange, onBlur, value }, children);
};

export const SubmitBtn = ({ children, ...props }) => {
  const { isSubmitting } = useFormikContext();
  return (
    <button type="submit" disabled={isSubmitting} {...props}>
      {children}
    </button>
  );
};
