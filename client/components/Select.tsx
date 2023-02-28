import {
  autoUpdate,
  flip,
  offset as offsetMiddleware,
  Placement,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
} from '@floating-ui/react';
import cn from 'classnames';
import { isEmpty, isFunction, isNull, isString, isUndefined } from 'lodash-es';
import React from 'react';
import { ISelectedItem, ISelectItem } from '../../lib/types.js';
import { Portal, useImmerState } from '../lib/utils.js';
import s from './Select.module.css';

type ISelectProps = {
  data: ISelectItem[];
  defaultItem?: ISelectItem | null;
  onSelect?: (selectedItem: ISelectItem) => void;
  shouldClearOnSelect?: boolean;
  itemComponent?: (opts: { item; isSelected }) => JSX.Element; // TODO: typings?
  placeholder?: string;
  searchable?: boolean;
  maxDropdownHeight?: number;
  nothingFound?: string | (() => JSX.Element);
  offset?: number;
  placement?: Placement;
};

type IState = {
  inputValue: string;
  filter: string;
  selectedItem: ISelectedItem;
  keyboardChoosenIndex: number | null;
};

export const Select = (props: ISelectProps) => {
  const {
    data,
    nothingFound,
    itemComponent,
    defaultItem = null,
    placeholder = 'Search',
    offset = 10,
    placement = 'bottom-start',
    searchable = true,
    onSelect = null,
    maxDropdownHeight = 420,
    shouldClearOnSelect = false,
  } = props;

  const tooltipRootSelector = '#popoverRoot';
  const [isOpen, setIsOpen] = React.useState(false);
  const { x, y, strategy, refs, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offsetMiddleware(offset), flip(), shift()],
    whileElementsMounted: autoUpdate,
    placement,
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

  const getItemValue = (item: ISelectItem) => (isString(item) ? item : item.value);
  const getItemLabel = (item: ISelectItem) => (isString(item) ? item : item.label);
  const getItemIndex = (item: ISelectItem, data: ISelectItem[]) =>
    data.findIndex(el => getItemValue(item) === getItemValue(el));

  const [state, setState] = useImmerState<IState>({
    inputValue: defaultItem ? getItemLabel(defaultItem) : '',
    filter: '',
    selectedItem: defaultItem,
    keyboardChoosenIndex: defaultItem ? getItemIndex(defaultItem, data) : null,
  });
  const { inputValue, filter, selectedItem, keyboardChoosenIndex } = state;

  const filteredData = React.useMemo(() => {
    const regex = new RegExp(filter.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    return data.filter(el => getItemLabel(el).match(regex));
  }, [data, inputValue]);

  const isItemSelected = (item: ISelectItem) =>
    selectedItem && getItemValue(item) === getItemValue(selectedItem);

  const onChange = e => {
    const { value } = e.target;
    if (!isOpen) {
      setIsOpen(true);
    }
    setState({
      inputValue: value,
      filter: value,
      selectedItem: null,
      keyboardChoosenIndex: null,
    });
  };

  const selectItem = (el: ISelectItem) => () => {
    if (onSelect) {
      onSelect(el);
    }
    setIsOpen(false);
    const newState = shouldClearOnSelect
      ? { inputValue: '', filter: '', selectedItem: null, keyboardChoosenIndex: null }
      : {
          inputValue: getItemLabel(el),
          filter: '',
          selectedItem: el,
          keyboardChoosenIndex: getItemIndex(el, data),
        };
    setState(newState);
  };

  const myOnKeyDown = e => {
    if (isEmpty(filteredData)) return;
    const i = keyboardChoosenIndex;
    switch (e.code) {
      case 'ArrowUp':
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        e.preventDefault(); // stop input cursor from moving left and right
        if (i === null || i === 0) {
          setState({ keyboardChoosenIndex: filteredData.length - 1 });
        } else {
          setState({ keyboardChoosenIndex: i - 1 });
        }
        break;
      case 'ArrowDown':
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        e.preventDefault(); // stop input cursor from moving left and right
        if (i === null) {
          setState({ keyboardChoosenIndex: 0 });
        } else {
          setState({ keyboardChoosenIndex: (i + 1) % filteredData.length });
        }
        break;
      case 'Enter':
        e.preventDefault(); // stop form submitting
        if (i !== null) {
          selectItem(filteredData[i || 0])();
        }
        break;
      case 'Escape':
        if (isNull(selectedItem)) {
          setState({ keyboardChoosenIndex: null });
        } else {
          setState({ keyboardChoosenIndex: getItemIndex(selectedItem, filteredData) });
        }
        break;
    }
  };

  const preventFocusLoosing = e => e.preventDefault();

  const itemClass = (el, i) =>
    cn(s.item, {
      [s.item_selected]: isItemSelected(el),
      [s.item_keyboardChoosen]: i === keyboardChoosenIndex,
    });

  const { onKeyDown, ...referenceProps } = getReferenceProps() as any;
  const mergedOnKeyDown = e => {
    myOnKeyDown(e);
    onKeyDown(e);
  };

  return (
    <div>
      <input
        type="text"
        className={cn('form-control', { 'cursor-pointer': !searchable })}
        placeholder={placeholder}
        onChange={onChange}
        value={inputValue}
        onKeyDown={mergedOnKeyDown}
        ref={refs.setReference}
        {...referenceProps}
        readOnly={!searchable}
      />
      {isOpen && (
        <Portal selector={tooltipRootSelector}>
          <div
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: 'max-content',
              maxHeight: maxDropdownHeight,
            }}
            className={cn(s.list, 'shadow')}
            ref={refs.setFloating}
            onMouseDown={preventFocusLoosing}
            {...getFloatingProps()}
          >
            {filteredData.map((el, i) => (
              <div key={getItemValue(el)} className={itemClass(el, i)} onClick={selectItem(el)}>
                {itemComponent
                  ? React.createElement(itemComponent, { item: el, isSelected: isItemSelected(el) })
                  : getItemLabel(el)}
              </div>
            ))}
            {isEmpty(filteredData) && (
              <div className={cn(s.item, s.item_nothingFound)}>
                {isUndefined(nothingFound) && (
                  <div>
                    <span className="text-slate-500">Nothing found</span>
                    <i className="far fa-sad-tear ml-2 text-lg"></i>
                  </div>
                )}
                {isFunction(nothingFound) && React.createElement(nothingFound)}
                {isString(nothingFound) && <div>{nothingFound}</div>}
              </div>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
};
