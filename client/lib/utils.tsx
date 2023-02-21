import { Side } from '@floating-ui/react';
import cn from 'classnames';
import { format, parseISO } from 'date-fns';
import { useFormikContext } from 'formik';
import produce from 'immer';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import omit from 'lodash/omit';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { decode, encode, roles, wsGeneralEvents } from '../../lib/sharedUtils';
import {
  IApiErrors,
  IContext,
  IEmptyObject,
  INativeWSocketClient,
  IUsualSelect,
  IWsEvent,
  IWsGeneralEvent,
} from '../../lib/types';
import { MultiSelect } from '../components/MultiSelect';
import { Select } from '../components/Select';
import Context from './context';

export * from '../../lib/sharedUtils';
export { Context };

export const useContext = () => React.useContext<IContext>(Context);

export const NavLink = ({ href, children }) => {
  const router = useRouter();
  const { pathname } = router;
  const className = cn('nav-link', {
    'nav-link_active':
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

type ITooltipContext = {
  setIsOpen;
  x;
  y;
  strategy;
  refs;
  context;
  getReferenceProps;
  getFloatingProps;
  placement: Side;
  className;
  theme;
};
export const TooltipContext = React.createContext<ITooltipContext>(null as any);

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
  const { apiErrors, setApiErrors } = React.useContext(FormContext);
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

export const UsualSelect: IUsualSelect = ({ name, data, defaultItem }) => {
  const { setFieldValue } = useFormikContext();
  return (
    <Select
      data={data}
      placeholder=""
      defaultItem={defaultItem}
      searchable={false}
      onSelect={selectedItem => {
        if (isString(selectedItem)) {
          setFieldValue(name, selectedItem, false);
        } else {
          setFieldValue(name, selectedItem.value, false);
        }
      }}
    />
  );
};

export const FMultiSelect = ({ name, data, defaultItems }) => {
  const { setFieldValue } = useFormikContext();
  return (
    <MultiSelect
      data={data}
      defaultItems={defaultItems}
      onSelect={selectedItems => {
        setFieldValue(
          name,
          selectedItems.map(el => (isString(el) ? el : el.value)),
          false
        );
      }}
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

export const makeWsClient = url => {
  const wsEventHandlers = {} as any;
  const wsClient = {} as INativeWSocketClient;
  const socket = new WebSocket(url);

  wsClient.socket = socket;
  wsClient.on = (wsEvent: IWsEvent | IWsGeneralEvent, fn) => {
    if (Object.keys(wsGeneralEvents).includes(wsEvent)) {
      socket.addEventListener(wsEvent, fn);
    } else {
      wsEventHandlers[wsEvent] = fn;
    }
  };
  wsClient.emit = (wsEvent: IWsEvent, message = '') => {
    socket.send(encode(wsEvent, message));
  };
  wsClient.close = () => socket.close();

  socket.addEventListener('message', msgBuffer => {
    const { type, payload } = decode(msgBuffer.data);
    const handler = wsEventHandlers[type];
    if (!handler) {
      console.log(`
        receive event with type "${type}", but have no handler
        -> ${payload}
      `);
      return;
    }
    handler(payload);
  });

  return wsClient;
};

export const Portal = ({ children, selector }) => {
  const ref: any = React.useRef();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    ref.current = document.querySelector(selector);
    setMounted(true);
  }, [selector]);

  return mounted ? createPortal(children, ref.current) : null;
};

export const fmtISO = (isoDate, formatStr) => format(parseISO(isoDate), formatStr);
