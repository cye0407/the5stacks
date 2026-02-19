"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils/cn';
import { ChevronDown } from 'lucide-react';

export interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  allowCustom?: boolean;
  label?: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  allowCustom = true,
  label,
  error,
  hint,
  placeholder,
  disabled,
  className,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const comboboxId = label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${comboboxId}-error` : undefined;
  const hintId = hint && !error ? `${comboboxId}-hint` : undefined;

  // Derive display value from options
  const displayLabel = options.find((o) => o.value === value)?.label ?? value;

  // Filter options based on search
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Whether to show the custom entry row
  const showCustom =
    allowCustom &&
    search.trim().length > 0 &&
    !filtered.some((o) => o.label.toLowerCase() === search.toLowerCase());

  // Total navigable items
  const totalItems = filtered.length + (showCustom ? 1 : 0);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectValue = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
      setSearch('');
      setHighlightedIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % totalItems);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0) {
        if (highlightedIndex < filtered.length) {
          selectValue(filtered[highlightedIndex].value);
        } else if (showCustom) {
          selectValue(search.trim());
        }
      } else if (!isOpen) {
        setIsOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
      setHighlightedIndex(-1);
    }
  };

  const handleInputChange = (val: string) => {
    setSearch(val);
    setHighlightedIndex(0);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearch('');
    setHighlightedIndex(-1);
  };

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label
          htmlFor={comboboxId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={comboboxId}
          type="text"
          role="combobox"
          aria-controls={`${comboboxId}-listbox`}
          aria-expanded={isOpen}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId || hintId}
          aria-autocomplete="list"
          disabled={disabled}
          placeholder={placeholder}
          value={isOpen ? search : displayLabel}
          onFocus={handleInputFocus}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full px-3.5 py-2.5 pr-10 text-sm border rounded-lg bg-white transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700',
            'disabled:bg-gray-50 disabled:cursor-not-allowed',
            error
              ? 'border-error focus:ring-error/20 focus:border-error'
              : 'border-gray-300',
            className
          )}
        />
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none transition-transform',
            isOpen && 'rotate-180'
          )}
        />

        {isOpen && totalItems > 0 && (
          <ul
            ref={listRef}
            id={`${comboboxId}-listbox`}
            role="listbox"
            className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg py-1"
          >
            {filtered.map((option, idx) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectValue(option.value);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={cn(
                  'px-3.5 py-2 text-sm cursor-pointer transition-colors',
                  idx === highlightedIndex && 'bg-forest-50',
                  option.value === value && 'font-medium text-forest-700'
                )}
              >
                {option.label}
              </li>
            ))}
            {showCustom && (
              <li
                role="option"
                aria-selected={false}
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectValue(search.trim());
                }}
                onMouseEnter={() => setHighlightedIndex(filtered.length)}
                className={cn(
                  'px-3.5 py-2 text-sm cursor-pointer transition-colors border-t border-gray-100',
                  highlightedIndex === filtered.length && 'bg-forest-50'
                )}
              >
                Use &lsquo;<span className="font-medium">{search.trim()}</span>&rsquo;
              </li>
            )}
          </ul>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}

Combobox.displayName = 'Combobox';
