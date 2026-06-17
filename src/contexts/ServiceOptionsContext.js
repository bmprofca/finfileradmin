import { createContext, useContext } from "react";

const ServiceOptionsContext = createContext();

export const useServiceOptions = () => {
  const context = useContext(ServiceOptionsContext);

  if (!context) {
    throw new Error("useServiceOptions must be used within ServiceOptionsProvider");
  }

  return context;
};

// Service type/category options
const serviceTypeOptions = [
  { value: "Tax & Compliance", label: "Tax & Compliance" },
  { value: "Business Registration", label: "Business Registration" },
  { value: "Legal & Documentation", label: "Legal & Documentation" },
  { value: "Accounting & Bookkeeping", label: "Accounting & Bookkeeping" },
  { value: "Trademark & IP", label: "Trademark & IP" },
  { value: "Company Formation", label: "Company Formation" },
  { value: "Import & Export", label: "Import & Export" },
  { value: "Licensing & Permits", label: "Licensing & Permits" },
  { value: "Annual Filings", label: "Annual Filings" },
  { value: "Payroll & HR", label: "Payroll & HR" },
  { value: "Other", label: "Other" },
];

export const ServiceOptionsProvider = ({ children }) => {
  return (
    <ServiceOptionsContext.Provider
      value={{
        serviceTypeOptions,
      }}
    >
      {children}
    </ServiceOptionsContext.Provider>
  );
};
