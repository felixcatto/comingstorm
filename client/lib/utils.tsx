import { Side } from '@floating-ui/react';
import cn from 'classnames';
import { format, parseISO } from 'date-fns';
import { useFormikContext } from 'formik';
import { isFunction, omit } from 'lodash-es';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { createPortal } from 'react-dom';
import { roles } from '../../lib/sharedUtils.js';
import {
  IApiErrors,
  IContext,
  IEmptyObject,
  IFMultiSelectProps,
  ISelectedOption,
  IUseMergeState,
  IUseSubmit,
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

export const useMergeState: IUseMergeState = initialState => {
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

// eslint-disable-next-line
export const WithApiErrors = (Component: React.ComponentType<IApiErrors>) => props => {
  const [apiErrors, setApiErrors] = React.useState({}); // eslint-disable-line
  return (
    <FormContext.Provider value={{ apiErrors, setApiErrors }}>
      <Component {...props} apiErrors={apiErrors} setApiErrors={setApiErrors} />
    </FormContext.Provider>
  );
};

export const useSubmit: IUseSubmit = onSubmit => {
  const { setApiErrors } = React.useContext(FormContext);

  const wrappedSubmit = async (values, actions) => {
    try {
      await onSubmit(values, actions);
    } catch (e: any) {
      if (e.errors) setApiErrors(e.errors);
    }
  };

  return wrappedSubmit;
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

export const UsualSelect: IUsualSelect = ({ name, options, defaultItem }) => {
  const { setFieldValue } = useFormikContext();
  const [selectedOption, setSelectedOption] = React.useState<ISelectedOption>(null);
  const computedOption = selectedOption || defaultItem;

  return (
    <Select
      options={options}
      selectedOption={computedOption}
      placeholder=""
      searchable={false}
      onSelect={selectedOption => {
        setFieldValue(name, selectedOption.value, false);
        setSelectedOption(selectedOption);
      }}
    />
  );
};

export const FMultiSelect = (props: IFMultiSelectProps) => {
  const { name, options, defaultOptions = [] } = props;
  const { setFieldValue } = useFormikContext();
  const [selectedOptions, setSelectedOptions] = React.useState(defaultOptions);

  return (
    <MultiSelect
      options={options}
      selectedOptions={selectedOptions}
      onSelect={newSelectedOptions => {
        setSelectedOptions(newSelectedOptions);
        setFieldValue(
          name,
          newSelectedOptions.map(el => el.value),
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

export const decode = (message: string) => JSON.parse(message) as IWSDecodeReturn;

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

export const makeCaseInsensitiveRegex = str =>
  new RegExp(str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

export const toSelectOptions = values => values.map(value => ({ value, label: value }));
