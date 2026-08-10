"use client";
import { createContext, useContext, useState, useEffect } from "react";

const CurrencyContext = createContext();

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState("jpy");

  useEffect(() => {
    const saved = localStorage.getItem("currency");
    if (saved === "jpy" || saved === "usd") {
      setCurrency(saved);
    }
  }, []);

  const handleSetCurrency = (value) => {
    if (value === "jpy" || value === "usd") {
      localStorage.setItem("currency", value);
      setCurrency(value);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, setCurrency: handleSetCurrency }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
