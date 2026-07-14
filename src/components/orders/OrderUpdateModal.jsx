import React, { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import Modal from "../common/Modal";
import SelectField from "../common/SelectField";
import { ConstantOptions } from "../../contexts/ConstantOptionsContext";

const OrderUpdateModal = ({
  order,
  services,
  servicesLoading,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const { discountTypeOptions } = ConstantOptions();
  const [form, setForm] = useState({
    order_name: order?.order_name || order?.name || "",
    service_id: order?.service_id || "",
    base_price: order?.base_price ?? "",
    tax_rate: order?.tax_rate ?? "",
    tax_value: order?.tax_value ?? "",
    total_fees: order?.total_fees ?? "",
    discount_type: order?.discount_type || "not applicable",
    discount_percentage: order?.discount_percentage ?? "",
    discount_value: order?.discount_value ?? "",
    fees: order?.fees ?? "",
    partial_payment_allowed: order?.partial_payment_allowed ?? true,
  });

  const inputCls =
    "w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none";
  const readOnlyCls =
    "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-600/50 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none";

  const handleNumberKeyPress = (e) => {
    if (!/[0-9.]/.test(e.key)) e.preventDefault();
  };
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
  };

  useEffect(() => {
    const basePrice = Number(form.base_price) || 0;
    const taxRate = Number(form.tax_rate) || 0;
    const discountPercentage = Number(form.discount_percentage) || 0;
    const discountType = form.discount_type;

    const taxValue = parseFloat(((basePrice * taxRate) / 100).toFixed(2));
    const totalFees = parseFloat((basePrice + taxValue).toFixed(2));

    let discountValue;
    if (discountType === "percentage") {
      discountValue = parseFloat(
        ((totalFees * discountPercentage) / 100).toFixed(2)
      );
    } else if (discountType === "flat") {
      discountValue = Number(form.discount_value) || 0;
    } else {
      discountValue = 0;
    }

    const fees = parseFloat((totalFees - discountValue).toFixed(2));

    setForm((prev) => ({
      ...prev,
      tax_value: taxValue !== 0 ? taxValue : "",
      total_fees: totalFees !== 0 ? totalFees : "",
      ...(discountType === "percentage"
        ? { discount_value: discountValue !== 0 ? discountValue : "" }
        : {}),
      ...(discountType === "not applicable" ? { discount_value: "" } : {}),
      fees: fees !== 0 ? fees : "",
    }));
  }, [form.base_price, form.tax_rate, form.discount_type, form.discount_percentage]);

  const handleFlatDiscountChange = (e) => {
    const value = e.target.value;
    const discountValue = value === "" ? 0 : Number(value);
    const totalFees = Number(form.total_fees) || 0;
    const fees = parseFloat((totalFees - discountValue).toFixed(2));
    setForm((prev) => ({
      ...prev,
      discount_value: value === "" ? "" : discountValue,
      fees: fees !== 0 ? fees : "",
    }));
  };

  const handleServiceSelect = (selected) => {
    if (!selected) {
      setForm((prev) => ({ ...prev, service_id: "" }));
      return;
    }
    const svc = services.find((s) => s.service_id === selected.value);
    if (svc) {
      setForm((prev) => ({
        ...prev,
        service_id: svc.service_id,
        base_price: svc.base_price ?? "",
        tax_rate: svc.tax_rate ?? "",
        discount_type: svc.discount_type || "not applicable",
        discount_percentage: svc.discount_percentage ?? "",
        discount_value:
          svc.discount_type === "flat"
            ? (svc.discount_value ?? "")
            : prev.discount_value,
      }));
    } else {
      setForm((prev) => ({ ...prev, service_id: selected.value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    [
      "base_price",
      "tax_rate",
      "tax_value",
      "total_fees",
      "discount_percentage",
      "discount_value",
      "fees",
    ].forEach((k) => {
      payload[k] = Number(payload[k]);
    });
    payload.partial_payment_allowed = Boolean(payload.partial_payment_allowed);
    onSubmit(payload);
  };

  const isPercentageDiscount = form.discount_type === "percentage";
  const isFlatDiscount = form.discount_type === "flat";
  const isDiscountApplicable = form.discount_type !== "not applicable";

  const serviceOptions = services.map((s) => ({
    value: s.service_id,
    label: s.name,
  }));

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Update Order · ${order?.order_name || order?.name || ""}`}
      icon={Edit}
      size="3xl"
      contentClassName="p-0"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="order-update-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Edit size={14} />
          {isSubmitting ? "Updating..." : "Update Order"}
        </button>
      }
    >
      <form id="order-update-form" onSubmit={handleSubmit} className="p-6 space-y-8">
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
            Order Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Order Name *
              </label>
              <input
                required
                type="text"
                value={form.order_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, order_name: e.target.value }))
                }
                className={inputCls}
                placeholder="Order name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Service *
              </label>
              <SelectField
                options={serviceOptions}
                value={
                  serviceOptions.find((o) => o.value === form.service_id) || null
                }
                onChange={handleServiceSelect}
                placeholder={
                  servicesLoading ? "Loading services..." : "Select service..."
                }
                isLoading={servicesLoading}
              />
            </div>
          </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 border-b pb-2 dark:border-gray-700">
            Pricing &amp; Fees
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Tax Value, Total Fees, and Final Fees are calculated automatically. Fields with (auto) are read-only.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Base Price
              </label>
              <input
                type="text"
                name="base_price"
                value={form.base_price}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tax Rate (%)
              </label>
              <input
                type="text"
                name="tax_rate"
                value={form.tax_rate}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Tax Value <span className="text-xs text-gray-400 font-normal">(auto)</span>
              </label>
              <input
                type="text"
                value={form.tax_value}
                readOnly
                className={readOnlyCls}
                placeholder="—"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Total Fees <span className="text-xs text-gray-400 font-normal">(auto)</span>
              </label>
              <input
                type="text"
                value={form.total_fees}
                readOnly
                className={readOnlyCls}
                placeholder="—"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Discount Type
              </label>
              <SelectField
                options={discountTypeOptions}
                value={
                  discountTypeOptions.find(
                    (o) => o.value === form.discount_type
                  ) || discountTypeOptions[0]
                }
                onChange={(selected) =>
                  setForm((prev) => ({
                    ...prev,
                    discount_type: selected?.value || "not applicable",
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Discount %
                {!isPercentageDiscount && (
                  <span className="text-xs text-gray-400 font-normal ml-1">(n/a)</span>
                )}
              </label>
              <input
                type="text"
                name="discount_percentage"
                value={form.discount_percentage}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                disabled={!isPercentageDiscount}
                className={isPercentageDiscount ? inputCls : readOnlyCls}
                placeholder={isPercentageDiscount ? "0" : "—"}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Discount Value
                {isPercentageDiscount && (
                  <span className="text-xs text-gray-400 font-normal">(auto)</span>
                )}
                {!isDiscountApplicable && (
                  <span className="text-xs text-gray-400 font-normal">(n/a)</span>
                )}
              </label>
              <input
                type="text"
                name="discount_value"
                value={form.discount_value}
                readOnly={!isFlatDiscount}
                onKeyPress={isFlatDiscount ? handleNumberKeyPress : undefined}
                onChange={isFlatDiscount ? handleFlatDiscountChange : undefined}
                className={isFlatDiscount ? inputCls : readOnlyCls}
                placeholder={isFlatDiscount ? "0" : "—"}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Final Fees <span className="text-xs text-gray-400 font-normal">(auto)</span>
              </label>
              <input
                type="text"
                value={form.fees}
                readOnly
                className={`${readOnlyCls} font-semibold text-gray-700 dark:text-gray-200`}
                placeholder="—"
              />
            </div>
          </div>

          {Number(form.base_price) > 0 && (
            <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-700 dark:text-indigo-300 flex flex-wrap gap-x-4 gap-y-1">
              <span>Base <strong>{form.base_price}</strong></span>
              <span>+ Tax <strong>{form.tax_value || 0}</strong></span>
              <span>= Total <strong>{form.total_fees || 0}</strong></span>
              {isDiscountApplicable && (
                <span>− Discount <strong>{form.discount_value || 0}</strong></span>
              )}
              <span className="font-bold">= Final <strong>{form.fees || 0}</strong></span>
            </div>
          )}
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">
            Options
          </h3>
          <label className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={form.partial_payment_allowed}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  partial_payment_allowed: e.target.checked,
                }))
              }
              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            Partial payment allowed
          </label>
        </section>
      </form>
    </Modal>
  );
};

export default OrderUpdateModal;
