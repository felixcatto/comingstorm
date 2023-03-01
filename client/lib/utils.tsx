import { Side } from '@floating-ui/react';
import cn from 'classnames';
import { format, parseISO } from 'date-fns';
import { useFormikContext } from 'formik';
import { isFunction, isString, omit } from 'lodash-es';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { createPortal } from 'react-dom';
import { roles } from '../../lib/sharedUtils.js';
import {
  IApiErrors,
  IContext,
  IEmptyObject,
  IUseImmerState,
  IUsualSelect,
  IWSDecodeReturn,
} from '../../lib/types.js';
import { MultiSelect } from '../components/MultiSelect.js';
import { Select } from '../components/Select.js';
import Context from './context.js';

export * from '../../lib/sharedUtils.js';
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

export const useImmerState: IUseImmerState = initialState => {
  const [state, setState] = React.useState(initialState);

  const setImmerState = React.useCallback(fnOrObject => {
    if (isFunction(fnOrObject)) {
      const fn = fnOrObject;
      setState(curState => {
        const newState = fn(curState);
        return { ...curState, ...newState };
      });
    } else {
      const newState = fnOrObject;
      setState(curState => ({ ...curState, ...newState }));
    }
  }, []);

  return [state, setImmerState];
};

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

export const decode = objBuffer => JSON.parse(objBuffer.data.toString()) as IWSDecodeReturn;

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
