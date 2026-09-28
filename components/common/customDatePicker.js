"use client";

import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import moment from "moment";

export default function CustomDatePicker({
  value,
  onChange,
  format = "DD/MM/YYYY",
  views = ["year", "month", "day"],
  slotProps = {},
  ...props
}) {
  const momentVal =
    value && moment(value).isValid()
      ? moment(value)
      : null;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <DatePicker
        value={momentVal}
        onChange={onChange}
        views={views}
        format={format}
        slotProps={{
          ...slotProps,
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
              "& .MuiPickersDay-root.Mui-selected": {
                backgroundColor: "#2563eb !important",
                color: "#ffffff !important",
                fontWeight: 700,
                "&:hover": {
                  backgroundColor: "#1d4ed8 !important",
                },
              },
              "& .MuiPickersDay-today": {
                borderColor: "#3b82f6",
              },
            },
            ...(slotProps.popper || {}),
          },
        }}
        {...props}
      />
    </LocalizationProvider>
  );
}

