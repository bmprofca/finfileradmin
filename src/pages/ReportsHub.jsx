import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BarChart2, ShoppingCart } from "lucide-react";
import Report from "./Report";
import SalesReport from "./SalesReport";

const TABS = [
  { id: "report", label: "Report", icon: BarChart2 },
  { id: "sales-report", label: "Sales Report", icon: ShoppingCart },
];

export default function ReportsHub() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes("sales-report")) return "sales-report";
    return "report";
  });

  useEffect(() => {
    if (location.pathname.includes("sales-report") && activeTab !== "sales-report") {
      setActiveTab("sales-report");
    } else if (!location.pathname.includes("sales-report") && activeTab !== "report") {
      setActiveTab("report");
    }
  }, [location.pathname, activeTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(tabId === "sales-report" ? "/sales-report" : "/report");
  };

  return (
    <>
      {activeTab === "report" && (
        <Report tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      )}
      {activeTab === "sales-report" && (
        <SalesReport tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      )}
    </>
  );
}
