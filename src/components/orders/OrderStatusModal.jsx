import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import Modal from "../common/Modal";
import SelectField from "../common/SelectField";
import { ConstantOptions } from "../../contexts/ConstantOptionsContext";

const OrderStatusModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const { orderStatusOptions } = ConstantOptions();
  const [form, setForm] = useState({
    status: (order?.status || "created").toString().toLowerCase(),
    remark: order?.remark || "",
  });

  const inputCls =
    "w-full px-3 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm";

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update Status · ${order?.order_name || ""}`}
      icon={RefreshCw}
      size="md"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="order-status-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} />
          {isSubmitting ? "Updating..." : "Update Status"}
        </button>
      }
    >
      <form id="order-status-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Status
          </label>
          <SelectField
            options={orderStatusOptions}
            value={
              orderStatusOptions.find((option) => option.value === form.status) ||
              orderStatusOptions[0]
            }
            onChange={(selected) =>
              setForm((prev) => ({
                ...prev,
                status: selected?.value || "created",
              }))
            }
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
            Remark
          </label>
          <textarea
            value={form.remark}
            onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
            rows={4}
            placeholder="Add a status note..."
            className={inputCls}
          />
        </div>
      </form>
    </Modal>
  );
};

export default OrderStatusModal;
