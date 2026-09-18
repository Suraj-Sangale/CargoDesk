import React, { forwardRef } from "react";
import customSearchStyle from "@/styles/common/customSearch.module.scss";

const CustomSearch = forwardRef(
  (
    {
      selectedValue,
      value,
      options = [],
      onChange,
      placeholder = "Select Option",
      className = "",
      disabled = false,
      name,
      id,
      isSearchable,
      instanceId,
      menuPosition,
      ...props
    },
    ref
  ) => {
    // Resolve current value from either selectedValue or value prop
    const resolvedValue = selectedValue !== undefined ? selectedValue : value;
    let currentValue = "";
    if (resolvedValue && typeof resolvedValue === "object") {
      currentValue = resolvedValue.value !== undefined ? resolvedValue.value : "";
    } else if (resolvedValue !== undefined && resolvedValue !== null) {
      currentValue = resolvedValue;
    }

    const handleChange = (e) => {
      const selectedVal = e.target.value;
      const selectedOption = options.find(
        (opt) =>
          String(typeof opt === "object" && opt !== null ? opt.value : opt) ===
          String(selectedVal)
      );

      // Construct a response object compatible with both react-select consumers and native event consumers
      const result =
        selectedOption !== undefined
          ? typeof selectedOption === "object" && selectedOption !== null
            ? {
                ...selectedOption,
                target: { name: name || props.name, value: selectedVal },
              }
            : {
                value: selectedVal,
                label: selectedVal,
                target: { name: name || props.name, value: selectedVal },
              }
          : selectedVal
          ? {
              value: selectedVal,
              label: selectedVal,
              target: { name: name || props.name, value: selectedVal },
            }
          : null;

      if (onChange) {
        onChange(result);
      }
    };

    return (
      <div
        className={`${customSearchStyle.selectContainer} ${
          disabled ? customSearchStyle.disabled : ""
        }`}
      >
        <select
          ref={ref}
          name={name}
          id={id}
          disabled={disabled}
          value={currentValue}
          onChange={handleChange}
          className={`${customSearchStyle.selectControl} ${
            !currentValue ? customSearchStyle.placeholder : ""
          } ${className || ""}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden={Boolean(currentValue)}>
              {placeholder}
            </option>
          )}
          {options.map((option, index) => {
            const isObj = typeof option === "object" && option !== null;
            const optVal = isObj ? option.value : option;
            const optLabel = isObj ? (option.label ?? option.value) : option;
            const isDisabled = isObj ? Boolean(option.isDisabled) : false;

            return (
              <option
                key={isObj && option.id ? option.id : `${optVal}-${index}`}
                value={optVal}
                disabled={isDisabled}
              >
                {optLabel}
              </option>
            );
          })}
        </select>
        <div className={customSearchStyle.arrowWrapper}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    );
  }
);

// Set the display name
CustomSearch.displayName = "CustomSearch";

export default CustomSearch;

