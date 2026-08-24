'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './CustomDatePicker.module.css';

interface CustomDatePickerProps {
  value: string; // Expected format: 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = 'DD / MM / YYYY',
  id,
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const currentYear = today.getFullYear();

  // Selected date object parsed from value
  const parsedValue = value ? new Date(value + 'T00:00:00') : null;
  const validValue = parsedValue && !isNaN(parsedValue.getTime()) ? parsedValue : null;

  // Viewing month and year state
  const [viewYear, setViewYear] = useState<number>(validValue ? validValue.getFullYear() : 2000);
  const [viewMonth, setViewMonth] = useState<number>(validValue ? validValue.getMonth() : 0);

  useEffect(() => {
    if (validValue) {
      setViewYear(validValue.getFullYear());
      setViewMonth(validValue.getMonth());
    }
  }, [value]);

  // Close calendar on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format displayed value as DD / MM / YYYY
  const formattedDisplay = validValue
    ? `${String(validValue.getDate()).padStart(2, '0')} / ${String(validValue.getMonth() + 1).padStart(
        2,
        '0'
      )} / ${validValue.getFullYear()}`
    : '';

  // Generate Year Options (e.g. 1930 to currentYear)
  const years = Array.from({ length: currentYear - 1930 + 1 }, (_, i) => currentYear - i);

  // Month navigation
  function handlePrevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  }

  function handleNextMonth() {
    if (viewYear === currentYear && viewMonth === today.getMonth()) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  }

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  function handleSelectDay(day: number) {
    const selectedDate = new Date(viewYear, viewMonth, day);
    if (selectedDate > today) return; // Prevent future DOB

    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    onChange(dateStr);
    setIsOpen(false);
  }

  return (
    <div className={styles.datePickerContainer} ref={containerRef}>
      <div
        className={`${styles.inputTrigger} ${isOpen ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        tabIndex={disabled ? -1 : 0}
        id={id}
        role="button"
        aria-haspopup="grid"
        aria-expanded={isOpen}
      >
        <span className={formattedDisplay ? styles.inputText : styles.placeholderText}>
          {formattedDisplay || placeholder}
        </span>
        <CalendarIcon size={16} className={styles.calendarIcon} />
      </div>

      {isOpen && (
        <div className={styles.popover}>
          {/* Header Controls: Month & Year Selectors */}
          <div className={styles.header}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={handlePrevMonth}
              aria-label="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className={styles.selectWrap}>
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className={styles.selectMonth}
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className={styles.selectYear}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className={styles.navBtn}
              onClick={handleNextMonth}
              disabled={viewYear === currentYear && viewMonth === today.getMonth()}
              aria-label="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Days of Week Row */}
          <div className={styles.weekGrid}>
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className={styles.weekHeader}>
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={styles.daysGrid}>
            {/* Empty slots for offset */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className={styles.emptySlot} />
            ))}

            {/* Day slots */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(viewYear, viewMonth, day);
              const isFuture = dateObj > today;
              const isSelected =
                validValue &&
                validValue.getFullYear() === viewYear &&
                validValue.getMonth() === viewMonth &&
                validValue.getDate() === day;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isFuture}
                  className={`${styles.dayBtn} ${isSelected ? styles.selected : ''} ${
                    isFuture ? styles.futureDay : ''
                  }`}
                  onClick={() => handleSelectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
