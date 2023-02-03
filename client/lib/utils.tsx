import { useState } from 'react';
import cn from 'classnames';
import { useFormikContext } from 'formik';
import omit from 'lodash/omit';
import isFunction from 'lodash/isFunction';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { roles } from '../../lib/sharedUtils';
import Context from './context';
import { IEmptyObject } from './types';
import produce from 'immer';
import Select from 'react-select';

import { IGetApiUrl } from '../../lib/sharedUtils';
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

export const NavLink = ({ href, children }) => {
  const router = useRouter();
  const { pathname } = router;
  const className = cn('app__nav-link', {
    'app__nav-link_active':
      (href !== '/' && pathname.startsWith(href)) || (href === '/' && pathname === '/'),
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

export function useImmerState<T = any>(initialState) {
  const [state, setState] = useState<T>(initialState);

  const setImmerState = React.useRef(fnOrObject => {
    if (isFunction(fnOrObject)) {
      const fn = fnOrObject;
      setState(curState => produce(curState, fn));
    } else {
      const newState = fnOrObject;
      setState(curState => ({ ...curState, ...newState }));
    }
  });

  return [state, setImmerState.current] as const;
}

export const FormContext = React.createContext<IApiErrors>(null as any);

export const FormWrapper = ({ apiErrors, setApiErrors, children }) => (
  <FormContext.Provider value={{ apiErrors, setApiErrors }}>{children}</FormContext.Provider>
);

export const WithApiErrors = (Component: React.ComponentType<IApiErrors>) => props => {
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

export const MultiSelect = ({ name, defaultValue, options }) => {
  const { setFieldValue } = useFormikContext();
  return (
    <Select
      defaultValue={defaultValue}
      onChange={values => setFieldValue(name, values?.map(option => option.value) || [], false)}
      options={options}
      isMulti
    />
  );
};

export const useRefreshPage = () => {
  const router = useRouter();
  return () => router.replace(router.asPath);
};

export const emptyObject: IEmptyObject = new Proxy(
  {},
  {
    get() {
      return '';
    },
  }
);
