import React, { useState } from "react";
import { Activity } from "lucide-react";
import Modal from "../common/Modal";
import SelectField from "../common/SelectField";

const CA_STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const CaStatusModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const [status, setStatus] = useState(
    (order?.ca_status || "pending").toString().toLowerCase()
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(status);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update CA Status · ${order?.order_name || ""}`}
      icon={Activity}
      size="md"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="ca-status-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-fuchsia-600 dark:bg-fuchsia-500 text-white text-sm font-semibold hover:bg-fuchsia-700 dark:hover:bg-fuchsia-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Activity size={14} />
          {isSubmitting ? "Updating..." : "Update CA Status"}
        </button>
      }
    >
      <form id="ca-status-form" onSubmit={handleSubmit} className="space-y-4">
        {order?.ca && (
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {order.ca.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              @{order.ca.username}
            </p>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            CA Status
          </label>
          <SelectField
            options={CA_STATUS_OPTIONS}
            value={
              CA_STATUS_OPTIONS.find((o) => o.value === status) ||
              CA_STATUS_OPTIONS[0]
            }
            onChange={(selected) => setStatus(selected?.value || "pending")}
          />
        </div>
      </form>
    </Modal>
  );
};

export default CaStatusModal;
