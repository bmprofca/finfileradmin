import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Briefcase } from 'lucide-react';
import Modal from './Modal';
import SelectField from './SelectField';
import { useServiceOptions } from '../../contexts/ServiceOptionsContext';

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

  const handleSelectChange = (name, selectedOption) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedOption.value
    }));
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
      <form id="service-form" onSubmit={handleSubmit} className="p-6 space-y-2">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type/Category</label>
            <SelectField 
              options={serviceTypeOptions}
              value={formData.type ? { value: formData.type, label: formData.type } : null}
              onChange={(selected) => handleSelectChange('type', selected)}
              placeholder="Select category..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 z-20 relative">Status</label>
            <SelectField 
              options={[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }]}
              value={{ value: formData.status, label: (formData.status === true || formData.status === 1) ? 'Active' : 'Inactive' }}
              onChange={(selected) => handleSelectChange('status', selected)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Time</label>
            <input type="text" name="delivery_time" value={formData.delivery_time} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
            <input type="url" name="image" value={formData.image} onChange={handleChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />
        
        {/* Pricing */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price</label>
            <input type="text" name="base_price" value={formData.base_price} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
            <input type="text" name="tax_rate" value={formData.tax_rate} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Value</label>
            <input type="text" name="tax_value" value={formData.tax_value} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Fees</label>
            <input type="text" name="total_fees" value={formData.total_fees} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Type</label>
            <SelectField 
              options={[
                { value: 'not applicable', label: 'Not Applicable' },
                { value: 'percentage', label: 'Percentage' },
                { value: 'flat', label: 'Flat' }
              ]}
              value={{ value: formData.discount_type, label: formData.discount_type === 'percentage' ? 'Percentage' : formData.discount_type === 'flat' ? 'Flat' : 'Not Applicable' }}
              onChange={(selected) => handleSelectChange('discount_type', selected)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
            <input type="text" name="discount_percentage" value={formData.discount_percentage} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Value</label>
            <input type="text" name="discount_value" value={formData.discount_value} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Final Fees</label>
            <input type="text" name="fees" value={formData.fees} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Fields */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Dynamic Fields</h3>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Field Key (e.g., mobile)" 
              value={fieldInput.key} 
              onChange={(e) => setFieldInput({ ...fieldInput, key: e.target.value })} 
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="w-32">
              <SelectField 
                options={[{ value: true, label: 'True' }, { value: false, label: 'False' }]}
                value={{ value: fieldInput.value, label: fieldInput.value ? 'True' : 'False' }}
                onChange={(selected) => setFieldInput({ ...fieldInput, value: selected.value })}
              />
            </div>
            <button type="button" onClick={handleAddField} className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg flex items-center gap-1">
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

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Documents */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Required Documents</h3>
          <button type="button" onClick={handleAddDocument} className="text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-1 hover:text-emerald-700 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg transition-colors">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Name</label>
                  <input type="text" value={doc.name} onChange={(e) => handleDocumentChange(index, 'name', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 z-10 relative">Required?</label>
                  <SelectField 
                    options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]}
                    value={{ value: doc.is_required, label: doc.is_required ? 'Yes' : 'No' }}
                    onChange={(selected) => handleDocumentChange(index, 'is_required', selected.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accepted Extensions (comma separated)</label>
                  <input type="text" value={doc.accept_extensions?.join(', ') || ''} onChange={(e) => handleDocumentChange(index, 'accept_extensions', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" placeholder="pdf, jpg, png" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Size (Bytes)</label>
                  <input type="text" value={doc.max_size || ""} onKeyPress={handleNumberKeyPress} onChange={(e) => handleDocumentChange(index, 'max_size', e.target.value === "" ? "" : Number(e.target.value))} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input type="text" value={doc.description} onChange={(e) => handleDocumentChange(index, 'description', e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
            </div>
          ))}
          {formData.documents.length === 0 && (
            <p className="text-sm text-gray-500 italic">No documents required.</p>
          )}
        </div>

      </form>
    </Modal>
  );
}
