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
  useMergeRefs,
} from '@floating-ui/react';
import cn from 'classnames';
import difference from 'lodash/difference';
import differenceBy from 'lodash/differenceBy';
import isEmpty from 'lodash/isEmpty';
import isFunction from 'lodash/isFunction';
import isString from 'lodash/isString';
import isUndefined from 'lodash/isUndefined';
import React from 'react';
import { ISelectedItems, ISelectItem } from '../../lib/types';
import { Portal, useImmerState } from '../lib/utils';
import s from './MultiSelect.module.css';

type ISelectProps = {
  data: ISelectItem[];
  defaultItems?: ISelectItem[];
  onSelect?: (selectedItems: ISelectItem[]) => void;
  placeholder?: string;
  maxDropdownHeight?: number;
  nothingFound?: string | (() => JSX.Element);
  offset?: number;
  placement?: Placement;
};

type IState = {
  inputValue: string;
  filteredData: ISelectItem[];
  selectedItems: ISelectedItems;
  keyboardChoosenIndex: number | null;
  isFocused: boolean;
  dropdownWidth: number;
};

export const MultiSelect = (props: ISelectProps) => {
  const {
    data,
    nothingFound,
    defaultItems = [],
    placeholder = 'Select...',
    offset = 10,
    placement = 'bottom-start',
    onSelect = null,
    maxDropdownHeight = 420,
  } = props;

  const tooltipRootSelector = '#popoverRoot';
  const inputRef = React.useRef<any>(null);
  const selectRootRef = React.useRef<any>(null);
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
  const getAvailableData = (data: ISelectItem[], selectedItems: ISelectItem[]) => {
    if (isString(data[0])) {
      return difference(data, selectedItems);
    }
    return differenceBy(data, selectedItems, 'value');
  };

  const [state, setState] = useImmerState<IState>({
    inputValue: '',
    filteredData: getAvailableData(data, defaultItems),
    selectedItems: defaultItems,
    keyboardChoosenIndex: null,
    isFocused: false,
    dropdownWidth: 250,
  });
  const {
    inputValue,
    filteredData,
    selectedItems,
    keyboardChoosenIndex,
    isFocused,
    dropdownWidth,
  } = state;

  const onChange = e => {
    const { value } = e.target;
    const regex = new RegExp(value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    const availableData = getAvailableData(data, selectedItems);
    if (!isOpen) {
      setIsOpen(true);
    }
    setState({
      inputValue: value,
      filteredData: availableData.filter(el => getItemLabel(el).match(regex)),
      keyboardChoosenIndex: null,
    });
  };

  const selectItem = (el: ISelectItem) => () => {
    const newSelectedItems = selectedItems.concat(el);
    if (onSelect) {
      onSelect(newSelectedItems);
    }
    setIsOpen(false);
    setState({
      inputValue: '',
      filteredData: getAvailableData(data, newSelectedItems),
      selectedItems: newSelectedItems,
      keyboardChoosenIndex: null,
    });
  };

  const removeItem = newSelectedItems => {
    if (onSelect) {
      onSelect(newSelectedItems);
    }
    setState({
      filteredData: getAvailableData(data, newSelectedItems),
      selectedItems: newSelectedItems,
    });
  };
  const removeItemOnClick = el => e => {
    e.stopPropagation();
    const newSelectedItems = selectedItems.filter(item => getItemValue(item) !== getItemValue(el));
    removeItem(newSelectedItems);
  };

  const myOnKeyDown = e => {
    if (isEmpty(filteredData)) return;
    const i = keyboardChoosenIndex;
    switch (e.code) {
      case 'Backspace':
        if (inputValue) return;
        const newSelectedItems = selectedItems.slice(0, -1);
        removeItem(newSelectedItems);
        break;
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
        setState({ keyboardChoosenIndex: null });
        break;
    }
  };

  const myOnClick = e => {
    inputRef.current.focus();
    setState({ isFocused: true });
  };
  const onBlur = () => setState({ isFocused: false });
  const preventFocusLoosing = e => e.preventDefault();

  const itemClass = (el, i) =>
    cn(s.item, {
      [s.item_keyboardChoosen]: i === keyboardChoosenIndex,
    });

  const { onKeyDown, onClick, ...referenceProps } = getReferenceProps() as any;
  const referenceRef = useMergeRefs([selectRootRef, refs.setReference]);
  const mergedOnKeyDown = e => {
    myOnKeyDown(e);
    onKeyDown(e);
  };
  const mergedOnClick = e => {
    myOnClick(e);
    onClick(e);
  };

  React.useEffect(() => {
    setState({ dropdownWidth: selectRootRef.current.offsetWidth });
  }, []);

  return (
    <div>
      <div
        className={cn(s.selectRoot, 'form-control', { [s.selectRoot_focused]: isFocused })}
        onKeyDown={mergedOnKeyDown}
        onClick={mergedOnClick}
        onBlur={onBlur}
        ref={referenceRef}
        {...referenceProps}
      >
        <div className={cn(s.selectRow)}>
          {selectedItems.map(el => (
            <div key={getItemValue(el)} className={s.selectedItem}>
              <div>{getItemLabel(el)}</div>
              <i
                className={cn('fa fa-circle-xmark ml-1', s.removeIcon)}
                onClick={removeItemOnClick(el)}
                onMouseDown={preventFocusLoosing}
              ></i>
            </div>
          ))}
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            className={cn(s.input, { [s.input_active]: isFocused || isEmpty(selectedItems) })}
            placeholder={isEmpty(selectedItems) ? placeholder : ''}
            onChange={onChange}
            value={inputValue}
          />
        </div>
      </div>
      {isOpen && (
        <Portal selector={tooltipRootSelector}>
          <div
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: dropdownWidth,
              maxHeight: maxDropdownHeight,
            }}
            className={s.list}
            ref={refs.setFloating}
            onMouseDown={preventFocusLoosing}
            {...getFloatingProps()}
          >
            {filteredData.map((el, i) => (
              <div key={getItemValue(el)} className={itemClass(el, i)} onClick={selectItem(el)}>
                {getItemLabel(el)}
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
