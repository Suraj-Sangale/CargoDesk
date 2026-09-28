"use client";

import React, { forwardRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";
import CustomSearch from "./customSearch";

/**
 * FloatingInput Component
 * Implements transparent floating label with notched outlined border and solid 3D bottom depth accent.
 */
export const FloatingInput = forwardRef(
  (
    {
      id,
      name,
      label,
      type = "text",
      placeholder = " ",
      error,
      helperText,
      required = false,
      className = "",
      containerClassName = "",
      labelClassName = "",
      icon: Icon,
      rightElement,
      disabled = false,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      children,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;
    const [isFocused, setIsFocused] = useState(false);
    const hasControlledValue =
      value !== undefined && value !== null && String(value).length > 0;

    const handleFocus = (e) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    const isError = Boolean(error);
    const errorMessage = typeof error === "object" ? error?.message : error;

    return (
      <div className={`w-full relative focus-within:z-20 ${containerClassName}`}>
        <div
          className={`relative group floating-group focus-within:z-20 ${
            hasControlledValue || isFocused ? "is-floated" : ""
          }`}
        >
          {/* Icon with focus active color */}
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#4bb7ff] transition-colors z-20">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder || " "}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`peer relative z-10 w-full px-4 py-3.5 text-sm bg-transparent text-slate-900 font-medium rounded-xl border-0 outline-none placeholder-transparent focus:placeholder-slate-400/50 ${
              Icon ? "pl-11" : ""
            } ${rightElement ? "pr-11" : ""} ${
              disabled ? "text-slate-400 cursor-not-allowed bg-slate-50/50" : ""
            } ${className}`}
            {...props}
          />

          {/* Notched Outline Fieldset (Cuts top border to exact label text width + applies 3D bottom depth) */}
          <fieldset
            aria-hidden="true"
            className={`notched-outline z-0 transition-all duration-200 ${
              isError
                ? "border-red-500 shadow-[0_3px_0_0_#ef4444]"
                : "border-slate-200/90 group-hover:border-slate-300 group-focus-within:border-[#4bb7ff] group-focus-within:shadow-[0_3px_0_0_#4bb7ff]"
            } ${disabled ? "bg-slate-50/60 border-slate-200" : "bg-white"}`}
          >
            {label && (
              <legend>
                <span>
                  {label}
                  {required ? " *" : ""}
                </span>
              </legend>
            )}
          </fieldset>

          {label && (
            <label
              htmlFor={inputId}
              className={`absolute cursor-text pointer-events-none transition-all duration-200 ease-out z-20 select-none bg-transparent ${
                Icon ? "left-11" : "left-4"
              } top-3.5 text-sm font-normal origin-left
              peer-focus:-top-1 peer-focus:left-3.5 peer-focus:text-xs peer-focus:font-semibold peer-focus:bg-transparent
              peer-[:not(:placeholder-shown)]:-top-1 peer-[:not(:placeholder-shown)]:left-3.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:bg-transparent
              peer-autofill:-top-1 peer-autofill:left-3.5 peer-autofill:text-xs peer-autofill:font-semibold peer-autofill:bg-transparent
              ${
                hasControlledValue
                  ? "!-top-1 !left-3.5 !text-xs !font-semibold !bg-transparent"
                  : ""
              }
              ${
                isError
                  ? "!text-red-500 peer-focus:!text-red-500 peer-[:not(:placeholder-shown)]:!text-red-500"
                  : hasControlledValue
                  ? "text-slate-700 font-semibold peer-focus:!text-[#4bb7ff] group-focus-within:!text-[#4bb7ff]"
                  : "text-[#8fa0b5] peer-focus:!text-[#4bb7ff] group-focus-within:!text-[#4bb7ff] peer-[:not(:placeholder-shown)]:!text-slate-700 peer-[:not(:placeholder-shown)]:font-semibold peer-autofill:!text-slate-700"
              } ${labelClassName}`}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}

          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-20">
              {rightElement}
            </div>
          )}

          {children}
        </div>

        {errorMessage && (
          <p className="text-red-500 text-xs font-normal mt-1.5 pl-1 flex items-center gap-1 animate-slide-down">
            <span>{errorMessage}</span>
          </p>
        )}
        {!errorMessage && helperText && (
          <p className="text-slate-500 text-xs font-normal mt-1 pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";

/**
 * FloatingSelect Component
 * Integrates CustomSearch with transparent floating label, notched outline, and 3D bottom depth accent.
 */
export const FloatingSelect = forwardRef(
  (
    {
      id,
      name,
      label,
      options = [],
      placeholder = "Select Option",
      error,
      helperText,
      required = false,
      className = "",
      containerClassName = "",
      labelClassName = "",
      icon: Icon,
      disabled = false,
      selectedValue,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      children,
      isSearchable,
      ...props
    },
    ref
  ) => {
    const selectId = id || name;
    const isError = Boolean(error);
    const errorMessage = typeof error === "object" ? error?.message : error;
    const hasVal =
      (value !== undefined && value !== null && String(value).length > 0) ||
      (selectedValue !== undefined && selectedValue !== null && String(selectedValue).length > 0);

    return (
      <div className={`w-full relative focus-within:z-40 ${containerClassName}`}>
        <div className="relative group floating-group is-floated focus-within:z-40">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#4bb7ff] transition-colors z-20">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <div className="relative z-21 w-full focus-within:z-50">
            <CustomSearch
              ref={ref}
              id={selectId}
              name={name}
              disabled={disabled}
              selectedValue={selectedValue}
              value={value !== undefined ? value : defaultValue}
              options={options}
              placeholder={placeholder}
              onChange={onChange}
              onFocus={onFocus}
              onBlur={onBlur}
              isSearchable={isSearchable}
              className={`!border-0 !shadow-none !bg-transparent !outline-none text-slate-900 font-medium ${
                Icon ? "!pl-11" : ""
              } ${className}`}
              {...props}
            >
              {children}
            </CustomSearch>
          </div>

          {/* Notched Outline Fieldset (Cuts top border to exact label text width + applies 3D bottom depth) */}
          <fieldset
            aria-hidden="true"
            className={`notched-outline z-0 transition-all duration-200 ${
              isError
                ? "border-red-500 shadow-[0_3px_0_0_#ef4444]"
                : "border-slate-200/90 group-hover:border-slate-300 group-focus-within:border-[#4bb7ff] group-focus-within:shadow-[0_3px_0_0_#4bb7ff]"
            } ${disabled ? "bg-slate-50/60 border-slate-200" : "bg-white"}`}
          >
            {label && (
              <legend>
                <span>
                  {label}
                  {required ? " *" : ""}
                </span>
              </legend>
            )}
          </fieldset>

          {label && (
            <label
              htmlFor={selectId}
              className={`absolute cursor-pointer pointer-events-none transition-all duration-200 ease-out z-20 select-none -top-1 left-3.5 text-xs font-semibold bg-transparent ${
                isError
                  ? "!text-red-500"
                  : hasVal
                  ? "text-slate-700 group-focus-within:!text-[#4bb7ff]"
                  : "text-[#8fa0b5] group-focus-within:!text-[#4bb7ff]"
              } ${labelClassName}`}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
        </div>

        {errorMessage && (
          <p className="text-red-500 text-xs font-normal mt-1.5 pl-1 flex items-center gap-1 animate-slide-down">
            <span>{errorMessage}</span>
          </p>
        )}
        {!errorMessage && helperText && (
          <p className="text-slate-500 text-xs font-normal mt-1 pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FloatingSelect.displayName = "FloatingSelect";

/**
 * FloatingTextarea Component
 * Textarea with transparent floating label, notched outline, and 3D bottom depth accent.
 */
export const FloatingTextarea = forwardRef(
  (
    {
      id,
      name,
      label,
      placeholder = " ",
      rows = 3,
      error,
      helperText,
      required = false,
      className = "",
      containerClassName = "",
      labelClassName = "",
      disabled = false,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const textareaId = id || name;
    const [isFocused, setIsFocused] = useState(false);
    const hasControlledValue =
      value !== undefined && value !== null && String(value).length > 0;
    const isError = Boolean(error);
    const errorMessage = typeof error === "object" ? error?.message : error;

    return (
      <div className={`w-full relative focus-within:z-20 ${containerClassName}`}>
        <div
          className={`relative group floating-group focus-within:z-20 ${
            hasControlledValue || isFocused ? "is-floated" : ""
          }`}
        >
          <textarea
            ref={ref}
            id={textareaId}
            name={name}
            rows={rows}
            placeholder={placeholder || " "}
            disabled={disabled}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              if (onFocus) onFocus(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              if (onBlur) onBlur(e);
            }}
            className={`peer relative z-10 w-full px-4 py-3.5 text-sm bg-transparent text-slate-900 font-medium rounded-xl border-0 outline-none placeholder-transparent focus:placeholder-slate-400/50 resize-none ${
              disabled ? "text-slate-400 cursor-not-allowed bg-slate-50/50" : ""
            } ${className}`}
            {...props}
          />

          {/* Notched Outline Fieldset with 3D bottom depth accent */}
          <fieldset
            aria-hidden="true"
            className={`notched-outline z-0 transition-all duration-200 ${
              isError
                ? "border-red-500 shadow-[0_3px_0_0_#ef4444]"
                : "border-slate-200/90 group-hover:border-slate-300 group-focus-within:border-[#4bb7ff] group-focus-within:shadow-[0_3px_0_0_#4bb7ff]"
            } ${disabled ? "bg-slate-50/60 border-slate-200" : "bg-white"}`}
          >
            {label && (
              <legend>
                <span>
                  {label}
                  {required ? " *" : ""}
                </span>
              </legend>
            )}
          </fieldset>

          {label && (
            <label
              htmlFor={textareaId}
              className={`absolute cursor-text pointer-events-none transition-all duration-200 ease-out z-20 select-none bg-transparent left-4 top-3.5 text-sm font-normal origin-left 
              peer-focus:-top-1 peer-focus:left-3.5 peer-focus:text-xs peer-focus:font-semibold peer-focus:bg-transparent
              peer-[:not(:placeholder-shown)]:-top-1 peer-[:not(:placeholder-shown)]:left-3.5 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:bg-transparent
              peer-autofill:-top-1 peer-autofill:left-3.5 peer-autofill:text-xs peer-autofill:font-semibold peer-autofill:bg-transparent
              ${
                hasControlledValue
                  ? "!-top-1 !left-3.5 !text-xs !font-semibold !bg-transparent"
                  : ""
              }
              ${
                isError
                  ? "!text-red-500 peer-focus:!text-red-500 peer-[:not(:placeholder-shown)]:!text-red-500"
                  : hasControlledValue
                  ? "text-slate-700 font-semibold peer-focus:!text-[#4bb7ff] group-focus-within:!text-[#4bb7ff]"
                  : "text-[#8fa0b5] peer-focus:!text-[#4bb7ff] group-focus-within:!text-[#4bb7ff] peer-[:not(:placeholder-shown)]:!text-slate-700 peer-[:not(:placeholder-shown)]:font-semibold peer-autofill:!text-slate-700"
              } ${labelClassName}`}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
        </div>

        {errorMessage && (
          <p className="text-red-500 text-xs font-normal mt-1.5 pl-1 flex items-center gap-1 animate-slide-down">
            <span>{errorMessage}</span>
          </p>
        )}
        {!errorMessage && helperText && (
          <p className="text-slate-500 text-xs font-normal mt-1 pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FloatingTextarea.displayName = "FloatingTextarea";

/**
 * FloatingDatePicker Component
 * Integrates Material UI X Date Picker with transparent floating label, notched outline, and 3D bottom depth accent.
 */
export const FloatingDatePicker = forwardRef(
  (
    {
      id,
      name,
      label,
      value,
      defaultValue,
      onChange,
      onFocus,
      onBlur,
      error,
      helperText,
      required = false,
      disabled = false,
      placeholder = "DD/MM/YYYY",
      format = "DD/MM/YYYY",
      className = "",
      containerClassName = "",
      labelClassName = "",
      icon: Icon,
      views = ["year", "month", "day"],
      minDate,
      maxDate,
      ...props
    },
    ref
  ) => {
    const pickerId = id || name;
    const [isFocused, setIsFocused] = useState(false);
    const isError = Boolean(error);
    const errorMessage = typeof error === "object" ? error?.message : error;

    // Normalize value to Moment object
    const momentVal =
      value && moment(value).isValid()
        ? moment(value)
        : defaultValue && moment(defaultValue).isValid()
        ? moment(defaultValue)
        : null;

    const hasVal = Boolean(momentVal && momentVal.isValid());

    return (
      <div className={`w-full relative focus-within:z-40 ${containerClassName}`}>
        <div className="relative group floating-group is-floated focus-within:z-40">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#4bb7ff] transition-colors z-20">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <div className="relative z-21 w-full focus-within:z-50">
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <DatePicker
                inputRef={ref}
                value={momentVal}
                onChange={(newVal) => {
                  if (onChange) {
                    onChange(newVal);
                  }
                }}
                onOpen={() => setIsFocused(true)}
                onClose={() => setIsFocused(false)}
                disabled={disabled}
                format={format}
                views={views}
                minDate={minDate ? moment(minDate) : undefined}
                maxDate={maxDate ? moment(maxDate) : undefined}
                slotProps={{
                  textField: {
                    id: pickerId,
                    name: name,
                    fullWidth: true,
                    variant: "standard",
                    InputProps: {
                      disableUnderline: true,
                      className: `text-slate-900 font-medium text-sm px-3.5 py-2.5 bg-transparent ${
                        Icon ? "!pl-11" : ""
                      } ${className}`,
                    },
                    inputProps: {
                      id: pickerId,
                      "data-field": pickerId,
                      className: "!py-0.5 text-slate-900 font-semibold text-sm placeholder:text-slate-400/60",
                      placeholder: placeholder,
                    },
                    onFocus: (e) => {
                      setIsFocused(true);
                      if (onFocus) onFocus(e);
                    },
                    onBlur: (e) => {
                      setIsFocused(false);
                      if (onBlur) onBlur(e);
                    },
                  },
                  openPickerButton: {
                    tabIndex: -1,
                  },
                  popper: {
                    sx: {
                      zIndex: 99999,
                      "& .MuiPaper-root": {
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        boxShadow:
                          "0 20px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.1)",
                        fontFamily: "inherit",
                        overflow: "hidden",
                      },
                      "& .MuiPickersCalendarHeader-root": {
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        paddingTop: "12px",
                      },
                      "& .MuiPickersCalendarHeader-label": {
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: "0.95rem",
                      },
                      "& .MuiDayCalendar-weekDayLabel": {
                        fontWeight: 600,
                        color: "#64748b",
                        fontSize: "0.75rem",
                      },
                      "& .MuiPickersDay-root": {
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        borderRadius: "10px",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "#2563eb !important",
                          color: "#ffffff !important",
                          fontWeight: 700,
                          boxShadow: "0 2px 4px 0 rgba(37, 99, 235, 0.35)",
                          "&:hover": {
                            backgroundColor: "#1d4ed8 !important",
                          },
                        },
                      },
                      "& .MuiPickersDay-today": {
                        borderColor: "#3b82f6",
                        borderWidth: "1.5px",
                      },
                      "& .MuiYearCalendar-root .MuiPickersYear-yearButton.Mui-selected": {
                        backgroundColor: "#2563eb !important",
                        color: "#ffffff !important",
                      },
                    },
                  },
                }}
                {...props}
              />
            </LocalizationProvider>
          </div>

          {/* Notched Outline Fieldset (Cuts top border to exact label text width + applies 3D bottom depth) */}
          <fieldset
            aria-hidden="true"
            className={`notched-outline z-0 transition-all duration-200 ${
              isError
                ? "border-red-500 shadow-[0_3px_0_0_#ef4444]"
                : "border-slate-200/90 group-hover:border-slate-300 group-focus-within:border-[#4bb7ff] group-focus-within:shadow-[0_3px_0_0_#4bb7ff]"
            } ${disabled ? "bg-slate-50/60 border-slate-200" : "bg-white"}`}
          >
            {label && (
              <legend>
                <span>
                  {label}
                  {required ? " *" : ""}
                </span>
              </legend>
            )}
          </fieldset>

          {label && (
            <label
              htmlFor={pickerId}
              className={`absolute cursor-pointer pointer-events-none transition-all duration-200 ease-out z-20 select-none -top-1 left-3.5 text-xs font-semibold bg-transparent ${
                isError
                  ? "!text-red-500"
                  : hasVal || isFocused
                  ? "text-slate-700 group-focus-within:!text-[#4bb7ff]"
                  : "text-[#8fa0b5] group-focus-within:!text-[#4bb7ff]"
              } ${labelClassName}`}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
        </div>

        {errorMessage && (
          <p className="text-red-500 text-xs font-normal mt-1.5 pl-1 flex items-center gap-1 animate-slide-down">
            <span>{errorMessage}</span>
          </p>
        )}
        {!errorMessage && helperText && (
          <p className="text-slate-500 text-xs font-normal mt-1 pl-1">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FloatingDatePicker.displayName = "FloatingDatePicker";

export default FloatingInput;
