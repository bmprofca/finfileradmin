import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import Modal from './Modal';
import SelectField from './SelectField';
import { ConstantOptions } from '../../contexts/ConstantOptionsContext';
import { uploadFile } from '../../utils/apiCall';
import toast from 'react-hot-toast';

const DEFAULT_FIELDS = {
  mobile: false,
  email: false,
  pan_no: false,
  aadhaar_no: false,
};

const FIELD_OPTIONS = [
  { key: 'mobile', label: 'Phone Number' },
  { key: 'email', label: 'Email' },
  { key: 'pan_no', label: 'PAN Number' },
  { key: 'aadhaar_no', label: 'Aadhaar Number' },
];

const DOCUMENT_EXTENSION_OPTIONS = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
const DOCUMENT_SIZE_UNITS = [
  { value: 'KB', label: 'KB', multiplier: 1024 },
  { value: 'MB', label: 'MB', multiplier: 1024 * 1024 },
];

const getSizeUnitMultiplier = (unit) => (
  DOCUMENT_SIZE_UNITS.find((option) => option.value === unit)?.multiplier || DOCUMENT_SIZE_UNITS[1].multiplier
);

const bytesToSizeInput = (bytes) => {
  const numericBytes = Number(bytes);
  if (!numericBytes) return { value: '', unit: 'KB' };

  const mbMultiplier = getSizeUnitMultiplier('MB');
  if (numericBytes >= mbMultiplier && numericBytes % mbMultiplier === 0) {
    return { value: numericBytes / mbMultiplier, unit: 'MB' };
  }

  return { value: numericBytes / getSizeUnitMultiplier('KB'), unit: 'KB' };
};

const normalizeExtensions = (extensions) => {
  const extensionList = Array.isArray(extensions)
    ? extensions
    : String(extensions || '').split(',');

  return extensionList
    .map((extension) => String(extension).trim().replace(/^\./, '').toLowerCase())
    .filter(Boolean);
};

const normalizeDocumentForForm = (document) => {
  const sizeInput = bytesToSizeInput(document.max_size);

  return {
    ...document,
    accept_extensions: normalizeExtensions(document.accept_extensions),
    max_size: sizeInput.value,
    max_size_unit: sizeInput.unit,
  };
};

export default function ServiceFormModal({ service, onClose, onSubmit, isSubmitting }) {
  const { serviceTypeOptions, discountTypeOptions } = ConstantOptions();

  const [formData, setFormData] = useState({
    name: "",
    type: "",
    base_price: "",
    tax_rate: "",
    tax_value: "",
    total_fees: "",
    discount_type: "not applicable",
    discount_percentage: "",
    discount_value: "",
    fees: "",
    image: "",
    description: "",
    delivery_time: "",
    status: true,
    fields: DEFAULT_FIELDS,
    documents: []
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (service) {
      setFormData({
        service_id: service.service_id,
        name: service.name || "",
        type: service.type || "",
        base_price: service.base_price ?? "",
        tax_rate: service.tax_rate ?? "",
        tax_value: service.tax_value ?? "",
        total_fees: service.total_fees ?? "",
        discount_type: service.discount_type || "not applicable",
        discount_percentage: service.discount_percentage ?? "",
        discount_value: service.discount_value ?? "",
        fees: service.fees ?? "",
        image: service.image || "",
        description: service.description || "",
        delivery_time: service.delivery_time || "",
        status: service.status !== undefined ? service.status : 1,
        fields: { ...DEFAULT_FIELDS, ...(service.fields || {}) },
        documents: (service.documents || []).map(normalizeDocumentForForm)
      });
    } else {
      setFormData(prev => ({
        ...prev,
        fields: DEFAULT_FIELDS,
      }));
    }
  }, [service]);

  // ── Auto-calculation effect ──────────────────────────────────────────────
  useEffect(() => {
    const basePrice = Number(formData.base_price) || 0;
    const taxRate = Number(formData.tax_rate) || 0;
    const discountPercentage = Number(formData.discount_percentage) || 0;
    const discountType = formData.discount_type;

    // Tax Value = Base Price × Tax Rate / 100
    const taxValue = parseFloat((basePrice * taxRate / 100).toFixed(2));

    // Total Fees = Base Price + Tax Value
    const totalFees = parseFloat((basePrice + taxValue).toFixed(2));

    // Discount Value:
    //   • percentage → auto-calculated from totalFees × discountPercentage / 100
    //   • flat       → user enters manually (don't overwrite)
    //   • not applicable → 0
    let discountValue;
    if (discountType === 'percentage') {
      discountValue = parseFloat((totalFees * discountPercentage / 100).toFixed(2));
    } else if (discountType === 'flat') {
      discountValue = Number(formData.discount_value) || 0;
    } else {
      discountValue = 0;
    }

    // Final Fees = Total Fees − Discount Value
    const fees = parseFloat((totalFees - discountValue).toFixed(2));

    setFormData(prev => ({
      ...prev,
      tax_value: taxValue !== 0 ? taxValue : "",
      total_fees: totalFees !== 0 ? totalFees : "",
      // Only overwrite discount_value when it's auto-driven (percentage type)
      ...(discountType === 'percentage'
        ? { discount_value: discountValue !== 0 ? discountValue : "" }
        : {}),
      // Clear discount_value when switching to "not applicable"
      ...(discountType === 'not applicable'
        ? { discount_value: "" }
        : {}),
      fees: fees !== 0 ? fees : "",
    }));
  }, [
    formData.base_price,
    formData.tax_rate,
    formData.discount_type,
    formData.discount_percentage,
    // Note: formData.discount_value is intentionally NOT a dependency here
    // to avoid an infinite loop when the user types in the flat discount field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  // Recalculate Final Fees when user manually changes flat discount_value
  const handleFlatDiscountChange = (e) => {
    const value = e.target.value;
    const discountValue = value === "" ? 0 : Number(value);
    const totalFees = Number(formData.total_fees) || 0;
    const fees = parseFloat((totalFees - discountValue).toFixed(2));

    setFormData(prev => ({
      ...prev,
      discount_value: value === "" ? "" : discountValue,
      fees: fees !== 0 ? fees : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadImageFile = async (file) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadFile(file);
      setFormData(prev => ({ ...prev, image: url }));
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = (e) => {
    uploadImageFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    if (isUploadingImage) return;
    uploadImageFile(e.dataTransfer.files?.[0]);
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => ({ ...prev, [name]: selectedOption?.value ?? "" }));
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none";
  const readOnlyCls = "w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-600/50 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none";

  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '0.75rem',
      backgroundColor: 'inherit'
    }),
    valueContainer: (base) => ({ ...base, padding: '2px 12px' })
  };

  const handleNumberKeyPress = (e) => {
    if (!/[0-9.]/.test(e.key)) e.preventDefault();
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
  };

  const handleFieldToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      fields: {
        ...DEFAULT_FIELDS,
        ...prev.fields,
        [key]: !Boolean(prev.fields?.[key]),
      }
    }));
  };

  const handleAddDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        { required_id: `reqdoc${Date.now()}`, name: "", is_required: true, accept_extensions: ["pdf", "jpg", "png"], max_size: 5, max_size_unit: "KB", description: "" }
      ]
    }));
  };

  const handleDocumentChange = (index, field, value) => {
    const updatedDocs = [...formData.documents];
    updatedDocs[index][field] = value;
    setFormData(prev => ({ ...prev, documents: updatedDocs }));
  };

  const handleDocumentExtensionToggle = (index, extension) => {
    const updatedDocs = [...formData.documents];
    const currentExtensions = normalizeExtensions(updatedDocs[index].accept_extensions);
    const hasExtension = currentExtensions.includes(extension);

    updatedDocs[index].accept_extensions = hasExtension
      ? currentExtensions.filter((item) => item !== extension)
      : [...currentExtensions, extension];

    setFormData(prev => ({ ...prev, documents: updatedDocs }));
  };

  const handleRemoveDocument = (index) => {
    setFormData(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== index) }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const submissionData = { ...formData };
    ["base_price", "tax_rate", "tax_value", "total_fees", "discount_percentage", "discount_value", "fees"].forEach(key => {
      submissionData[key] = Number(submissionData[key]);
    });
    submissionData.fields = FIELD_OPTIONS.reduce((fields, field) => ({
      ...fields,
      [field.key]: Boolean(formData.fields?.[field.key]),
    }), {});
    submissionData.documents = formData.documents.map(({ max_size_unit, ...document }) => ({
      ...document,
      accept_extensions: normalizeExtensions(document.accept_extensions),
      max_size: document.max_size === "" ? "" : Math.round(Number(document.max_size) * getSizeUnitMultiplier(max_size_unit)),
    }));
    onSubmit(submissionData);
  };

  const isPercentageDiscount = formData.discount_type === 'percentage';
  const isFlatDiscount = formData.discount_type === 'flat';
  const isDiscountApplicable = formData.discount_type !== 'not applicable';

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={service ? 'Edit Service' : 'Add New Service'}
      icon={Briefcase}
      size="4xl"
      contentClassName="p-0"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="service-form"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Service'}
        </button>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="p-6 space-y-8">

        {/* ── Basic Info ──────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Service Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className={inputCls} placeholder="e.g. Tax Consultation" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Type/Category *</label>
              <SelectField
                options={serviceTypeOptions}
                value={serviceTypeOptions.find((option) => option.value === formData.type) || null}
                onChange={(selected) => handleSelectChange('type', selected)}
                placeholder="Select category..."
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <SelectField
                options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]}
                value={{ value: formData.status, label: (formData.status === true || formData.status === 1) ? 'Active' : 'Inactive' }}
                onChange={(selected) => handleSelectChange('status', selected)}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Delivery Time</label>
              <input type="text" name="delivery_time" value={formData.delivery_time} onChange={handleChange} className={inputCls} placeholder="e.g. 3-5 Business Days" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className={inputCls} placeholder="Detailed service description..."></textarea>
            </div>
          </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* ── Pricing ─────────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 border-b pb-2 dark:border-gray-700">Pricing &amp; Fees</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Tax Value, Total Fees, and Final Fees are calculated automatically. Fields with a lock icon are read-only.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Row 1: Base Price · Tax Rate · Tax Value (auto) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Base Price</label>
              <input
                type="text"
                name="base_price"
                value={formData.base_price}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tax Rate (%)</label>
              <input
                type="text"
                name="tax_rate"
                value={formData.tax_rate}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                className={inputCls}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Tax Value
                <span className="text-xs text-gray-400 font-normal">(auto)</span>
              </label>
              <input
                type="text"
                name="tax_value"
                value={formData.tax_value}
                readOnly
                className={readOnlyCls}
                placeholder="—"
                title="Auto-calculated: Base Price × Tax Rate / 100"
              />
            </div>

            {/* Row 2: Total Fees (auto) · Discount Type · Discount % */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Total Fees
                <span className="text-xs text-gray-400 font-normal">(auto)</span>
              </label>
              <input
                type="text"
                name="total_fees"
                value={formData.total_fees}
                readOnly
                className={readOnlyCls}
                placeholder="—"
                title="Auto-calculated: Base Price + Tax Value"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label>
              <SelectField
                options={discountTypeOptions}
                value={discountTypeOptions.find((option) => option.value === formData.discount_type) || discountTypeOptions[0]}
                onChange={(selected) => handleSelectChange('discount_type', selected)}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Discount %
                {!isPercentageDiscount && <span className="text-xs text-gray-400 font-normal ml-1">(n/a)</span>}
              </label>
              <input
                type="text"
                name="discount_percentage"
                value={formData.discount_percentage}
                onKeyPress={handleNumberKeyPress}
                onChange={handleNumberChange}
                disabled={!isPercentageDiscount}
                className={isPercentageDiscount ? inputCls : readOnlyCls}
                placeholder={isPercentageDiscount ? "0" : "—"}
                title={!isPercentageDiscount ? "Select 'Percentage' discount type to enable" : ""}
              />
            </div>

            {/* Row 3: Discount Value · Final Fees (auto) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Discount Value
                {isPercentageDiscount && <span className="text-xs text-gray-400 font-normal">(auto)</span>}
                {!isDiscountApplicable && <span className="text-xs text-gray-400 font-normal">(n/a)</span>}
              </label>
              <input
                type="text"
                name="discount_value"
                value={formData.discount_value}
                readOnly={!isFlatDiscount}
                onKeyPress={isFlatDiscount ? handleNumberKeyPress : undefined}
                onChange={isFlatDiscount ? handleFlatDiscountChange : undefined}
                className={isFlatDiscount ? inputCls : readOnlyCls}
                placeholder={isFlatDiscount ? "0" : "—"}
                title={
                  isPercentageDiscount
                    ? "Auto-calculated: Total Fees × Discount % / 100"
                    : !isDiscountApplicable
                      ? "Select a discount type to enable"
                      : ""
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                Final Fees
                <span className="text-xs text-gray-400 font-normal">(auto)</span>
              </label>
              <input
                type="text"
                name="fees"
                value={formData.fees}
                readOnly
                className={`${readOnlyCls} font-semibold text-gray-700 dark:text-gray-200`}
                placeholder="—"
                title="Auto-calculated: Total Fees − Discount Value"
              />
            </div>

          </div>

          {/* Live calculation summary */}
          {(Number(formData.base_price) > 0) && (
            <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex flex-wrap gap-x-4 gap-y-1">
              <span>Base <strong>{formData.base_price}</strong></span>
              <span>+ Tax <strong>{formData.tax_value || 0}</strong></span>
              <span>= Total <strong>{formData.total_fees || 0}</strong></span>
              {isDiscountApplicable && <span>− Discount <strong>{formData.discount_value || 0}</strong></span>}
              <span className="font-bold">= Final <strong>{formData.fees || 0}</strong></span>
            </div>
          )}
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* ── Dynamic Fields ──────────────────────────────────────────────── */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Dynamic Fields</h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIELD_OPTIONS.map((field) => {
                const enabled = Boolean(formData.fields?.[field.key]);
                return (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => handleFieldToggle(field.key)}
                    className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-emerald-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-emerald-700"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{field.label}</p>
                      <p className="mt-0.5 text-xs font-mono text-gray-500 dark:text-gray-400">{field.key}</p>
                    </div>
                    <div className={`relative h-7 w-14 shrink-0 rounded-full p-1 transition-colors ${enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* ── Documents ───────────────────────────────────────────────────── */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Required Documents</h3>
            <button type="button" onClick={handleAddDocument} className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1.5 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-lg transition-colors">
              <Plus size={16} /> Add Document
            </button>
          </div>
          <div className="space-y-4">
            {formData.documents.map((doc, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 relative shadow-sm">
                <button type="button" onClick={() => handleRemoveDocument(index)} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Document Name</label>
                    <input type="text" value={doc.name} onChange={(e) => handleDocumentChange(index, 'name', e.target.value)} className={inputCls} required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Required?</label>
                    <SelectField
                      options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]}
                      value={{ value: doc.is_required, label: doc.is_required ? 'Yes' : 'No' }}
                      onChange={(selected) => handleDocumentChange(index, 'is_required', selected.value)}
                      styles={selectStyles}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Accepted Extensions</label>
                    <div className="flex flex-wrap gap-2">
                      {DOCUMENT_EXTENSION_OPTIONS.map((extension) => {
                        const isSelected = normalizeExtensions(doc.accept_extensions).includes(extension);
                        return (
                          <button
                            key={extension}
                            type="button"
                            onClick={() => handleDocumentExtensionToggle(index, extension)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase transition-colors ${isSelected
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            aria-pressed={isSelected}
                          >
                            <span className={`h-3 w-3 rounded-full border ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-400 dark:border-gray-500'}`} />
                            {extension}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Max Size</label>
                    <div className="grid grid-cols-[1fr_110px] gap-2">
                      <input
                        type="text"
                        value={doc.max_size || ""}
                        onKeyPress={handleNumberKeyPress}
                        onChange={(e) => handleDocumentChange(index, 'max_size', e.target.value)}
                        className={inputCls}
                        placeholder="5"
                      />
                      <SelectField
                        options={DOCUMENT_SIZE_UNITS.map(({ value, label }) => ({ value, label }))}
                        value={DOCUMENT_SIZE_UNITS.find((option) => option.value === (doc.max_size_unit || 'KB')) || DOCUMENT_SIZE_UNITS[0]}
                        onChange={(selected) => handleDocumentChange(index, 'max_size_unit', selected.value)}
                        styles={selectStyles}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <input type="text" value={doc.description} onChange={(e) => handleDocumentChange(index, 'description', e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
            {formData.documents.length === 0 && (
              <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 dark:bg-gray-800/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                No documents required for this service.
              </p>
            )}
          </div>
        </section>

        {/* ── Service Image ────────────────────────────────────────────────── */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Service Banner / Image</h3>
          <label
            htmlFor="service-image-upload"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            className={`mt-2 flex cursor-pointer justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-within:ring-4 focus-within:ring-emerald-500/10 ${isUploadingImage ? 'pointer-events-none opacity-50' : ''}`}
          >
            <div className="text-center flex flex-col items-center">
              {formData.image && !isUploadingImage ? (
                <div className="mb-4">
                  <img src={formData.image} alt="Preview" className="w-40 h-24 rounded-lg object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto" />
                </div>
              ) : (
                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {isUploadingImage ? 'Uploading image...' : formData.image ? 'Change banner image' : 'Upload a banner image'}
                </span>
                <input id="service-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploadingImage} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click anywhere or drag and drop. PNG, JPG, GIF up to 5MB (16:9 recommended)</p>
            </div>
          </label>
        </section>

      </form>
    </Modal>
  );
}
