import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Briefcase } from 'lucide-react';
import Modal from './Modal';
import SelectField from './SelectField';
import { useServiceOptions } from '../../contexts/ServiceOptionsContext';
import { uploadFile } from '../../utils/apiCall';
import toast from 'react-hot-toast';

export default function ServiceFormModal({ service, onClose, onSubmit, isSubmitting }) {
  const { serviceTypeOptions } = useServiceOptions();
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
    fields: {},
    documents: []
  });

  const [fieldInput, setFieldInput] = useState({ key: '', value: true });
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
        fields: service.fields || {},
        documents: service.documents || []
      });
    }
  }, [service]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const url = await uploadFile(file);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOption.value
    }));
  };

  const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none";
  const selectStyles = {
    control: (base) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '0.75rem',
      backgroundColor: 'inherit'
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 12px'
    })
  };

  const handleNumberKeyPress = (e) => {
    if (!/[0-9.]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? "" : Number(value)
    }));
  };

  const handleAddField = () => {
    if (!fieldInput.key.trim()) return;
    setFormData(prev => ({
      ...prev,
      fields: { ...prev.fields, [fieldInput.key]: fieldInput.value }
    }));
    setFieldInput({ key: '', value: true });
  };

  const handleRemoveField = (keyToRemove) => {
    setFormData(prev => {
      const newFields = { ...prev.fields };
      delete newFields[keyToRemove];
      return { ...prev, fields: newFields };
    });
  };

  const handleAddDocument = () => {
    setFormData(prev => ({
      ...prev,
      documents: [
        ...prev.documents,
        { required_id: `reqdoc${Date.now()}`, name: "", is_required: true, accept_extensions: ["pdf", "jpg", "png"], max_size: 5242880, description: "" }
      ]
    }));
  };

  const handleDocumentChange = (index, field, value) => {
    const updatedDocs = [...formData.documents];
    if (field === 'accept_extensions') {
      updatedDocs[index][field] = value.split(',').map(ext => ext.trim());
    } else {
      updatedDocs[index][field] = value;
    }
    setFormData(prev => ({ ...prev, documents: updatedDocs }));
  };

  const handleRemoveDocument = (index) => {
    const updatedDocs = formData.documents.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, documents: updatedDocs }));
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    
    // Ensure numbers are properly converted before submit
    const submissionData = { ...formData };
    ["base_price", "tax_rate", "tax_value", "total_fees", "discount_percentage", "discount_value", "fees"].forEach(key => {
      submissionData[key] = Number(submissionData[key]);
    });
    
    onSubmit(submissionData);
  };

  return (
    <Modal 
      isOpen={true} 
      onClose={onClose} 
      title={service ? 'Edit Service' : 'Add New Service'}
      icon={Briefcase}
      size="4xl"
      contentClassName="p-0"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button 
            type="submit" 
            form="service-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Service'}
          </button>
        </div>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} className="p-6 space-y-8">
        {/* Basic Info */}
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
                value={formData.type ? { value: formData.type, label: formData.type } : null}
                onChange={(selected) => handleSelectChange('type', selected)}
                placeholder="Select category..."
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 z-20 relative">Status</label>
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
        
        {/* Pricing */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Pricing & Fees</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Base Price</label>
              <input type="text" name="base_price" value={formData.base_price} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tax Rate (%)</label>
              <input type="text" name="tax_rate" value={formData.tax_rate} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tax Value</label>
              <input type="text" name="tax_value" value={formData.tax_value} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Total Fees</label>
              <input type="text" name="total_fees" value={formData.total_fees} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label>
              <SelectField 
                options={[
                  { value: 'not applicable', label: 'Not Applicable' },
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'flat', label: 'Flat' }
                ]}
                value={{ value: formData.discount_type, label: formData.discount_type === 'percentage' ? 'Percentage' : formData.discount_type === 'flat' ? 'Flat' : 'Not Applicable' }}
                onChange={(selected) => handleSelectChange('discount_type', selected)}
                styles={selectStyles}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount %</label>
              <input type="text" name="discount_percentage" value={formData.discount_percentage} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Value</label>
              <input type="text" name="discount_value" value={formData.discount_value} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Final Fees</label>
              <input type="text" name="fees" value={formData.fees} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} />
            </div>
          </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Fields */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Dynamic Fields</h3>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex gap-3 mb-4">
              <input 
                type="text" 
                placeholder="Field Key (e.g., mobile)" 
                value={fieldInput.key} 
                onChange={(e) => setFieldInput({ ...fieldInput, key: e.target.value })} 
                className={inputCls}
              />
              <div className="w-40 shrink-0">
                <SelectField 
                  options={[{ value: true, label: 'True' }, { value: false, label: 'False' }]}
                  value={{ value: fieldInput.value, label: fieldInput.value ? 'True' : 'False' }}
                  onChange={(selected) => setFieldInput({ ...fieldInput, value: selected.value })}
                  styles={selectStyles}
                />
              </div>
              <button type="button" onClick={handleAddField} className="px-5 py-2.5 shrink-0 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-colors">
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
            {Object.entries(formData.fields).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm shadow-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                <span className={val ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{val ? 'true' : 'false'}</span>
                <button type="button" onClick={() => handleRemoveField(key)} className="ml-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Documents */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Required Documents</h3>
            <button type="button" onClick={handleAddDocument} className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1.5 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 rounded-xl transition-colors">
              <Plus size={16} /> Add Document
            </button>
          </div>
          <div className="space-y-4">
          {formData.documents.map((doc, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 relative shadow-sm">
              <button type="button" onClick={() => handleRemoveDocument(index)} className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm">
                <Trash2 size={16} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Document Name</label>
                  <input type="text" value={doc.name} onChange={(e) => handleDocumentChange(index, 'name', e.target.value)} className={inputCls} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 z-10 relative">Required?</label>
                  <SelectField 
                    options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]}
                    value={{ value: doc.is_required, label: doc.is_required ? 'Yes' : 'No' }}
                    onChange={(selected) => handleDocumentChange(index, 'is_required', selected.value)}
                    styles={selectStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Accepted Extensions</label>
                  <input type="text" value={doc.accept_extensions?.join(', ') || ''} onChange={(e) => handleDocumentChange(index, 'accept_extensions', e.target.value)} className={inputCls} placeholder="e.g. pdf, jpg, png" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Max Size (Bytes)</label>
                  <input type="text" value={doc.max_size || ""} onKeyPress={handleNumberKeyPress} onChange={(e) => handleDocumentChange(index, 'max_size', e.target.value === "" ? "" : Number(e.target.value))} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                  <input type="text" value={doc.description} onChange={(e) => handleDocumentChange(index, 'description', e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          ))}
          {formData.documents.length === 0 && (
            <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No documents required for this service.</p>
          )}
        </div>
        </section>

        {/* Service Image */}
        <section>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Service Banner / Image</h3>
          <div className={`mt-2 flex justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${isUploadingImage ? 'opacity-50' : ''}`}>
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
                <label htmlFor="service-image-upload" className="relative cursor-pointer rounded-md font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2">
                  <span>{isUploadingImage ? 'Uploading image...' : formData.image ? 'Change banner image' : 'Upload a banner image'}</span>
                  <input id="service-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">PNG, JPG, GIF up to 5MB (16:9 recommended)</p>
            </div>
          </div>
        </section>

      </form>
    </Modal>
  );
}
