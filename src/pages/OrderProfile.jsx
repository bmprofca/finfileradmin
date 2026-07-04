import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Briefcase, Building2, Calendar, ChevronLeft, ChevronRight, CreditCard,
  Download, Edit, ExternalLink, File, FileSpreadsheet, FileText, Hash,
  Image, IndianRupee, Mail, Phone, RefreshCw, Search, Tag, Upload, User,
  UserMinus, UserPlus, Users, X
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Modal from '../components/common/Modal';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import RefreshButton from '../components/common/RefreshButton';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { ConstantOptions } from '../contexts/ConstantOptionsContext';
import apiCall from '../utils/apiCall';
import toast from 'react-hot-toast';

/* ─── Shared Helpers ─── */
const STATUS_COLORS = {
  'created': { pill: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800', dot: 'bg-blue-500 dark:bg-blue-400' },
  'in process': { pill: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800', dot: 'bg-amber-500 dark:bg-amber-400' },
  'pending from department': { pill: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800', dot: 'bg-orange-500 dark:bg-orange-400' },
  'completed': { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800', dot: 'bg-emerald-500 dark:bg-emerald-400' },
  'cancelled': { pill: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800', dot: 'bg-red-500 dark:bg-red-400' },
};

const StatusBadge = ({ status }) => {
  const key = (status || '').toString().toLowerCase();
  const cfg = STATUS_COLORS[key] || { pill: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', dot: 'bg-slate-400 dark:bg-gray-500' };
  const display = key.replace(/\b\w/g, l => l.toUpperCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {display || 'Unknown'}
    </span>
  );
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-4">
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600">
      <Icon size={15} className="text-indigo-500 dark:text-indigo-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value ?? 'N/A'}</div>
    </div>
  </div>
);

const PAYMENT_STATUS_MAP = {
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

/* ─── Document helpers (shared with Documents.jsx) ─── */
const formatFileSize = (size) => {
  const bytes = Number(size) || 0;
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentExtension = (doc) => {
  const source = doc.file_name || doc.file_url || '';
  const clean = source.split('?')[0].split('#')[0];
  return clean.includes('.') ? clean.split('.').pop().toLowerCase() : '';
};

const FILE_TYPE_MAP = {
  jpg: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  jpeg: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  png: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  gif: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  webp: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  svg: { label: 'Image', icon: Image, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  pdf: { label: 'PDF', icon: FileText, color: 'text-red-500 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' },
  csv: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  xlsx: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  xls: { label: 'Spreadsheet', icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800' },
  doc: { label: 'Document', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' },
  docx: { label: 'Document', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800' },
  mp4: { label: 'Video', icon: File, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800' },
  zip: { label: 'Archive', icon: File, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' },
  rar: { label: 'Archive', icon: File, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600' },
};
const DEFAULT_FILE_TYPE = { label: 'File', icon: File, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' };
const getFileTypeInfo = (doc) => FILE_TYPE_MAP[getDocumentExtension(doc)] || DEFAULT_FILE_TYPE;
const getDocumentIcon = (doc) => { const info = getFileTypeInfo(doc); const Icon = info.icon; return <Icon size={18} className={info.color.split(' ')[0]} />; };

/* ─── Staff Skeleton ─── */
const StaffCardSkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div>
        <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
        <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
      </div>
    </div>
    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
  </div>
);

/* ─── Staff Management Modal ─── */
const StaffManagementModal = ({ order, allStaff, staffLoading, onClose, onSubmit, isSubmitting }) => {
  const [leftStaff, setLeftStaff] = useState([]);
  const [rightStaff, setRightStaff] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialRightStaff, setInitialRightStaff] = useState([]);
  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');

  useEffect(() => {
    if (order && allStaff.length > 0) {
      const assignedUsernames = order.assigned_staff?.map(s => s.username) || [];
      const left = allStaff.filter(s => !assignedUsernames.includes(s.username));
      const right = allStaff.filter(s => assignedUsernames.includes(s.username));
      setLeftStaff(left);
      setRightStaff(right);
      setInitialRightStaff(right.map(s => s.username));
      setHasChanges(false);
    }
  }, [order, allStaff]);

  const filterStaff = (list, search) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(s =>
      (s.full_name || s.name || '').toLowerCase().includes(q) ||
      (s.mobile || '').includes(q) ||
      (s.username || '').toLowerCase().includes(q)
    );
  };

  const moveToRight = (staff) => { setLeftStaff(prev => prev.filter(s => s.username !== staff.username)); setRightStaff(prev => [...prev, staff]); setHasChanges(true); };
  const moveToLeft = (staff) => { setRightStaff(prev => prev.filter(s => s.username !== staff.username)); setLeftStaff(prev => [...prev, staff]); setHasChanges(true); };
  const moveAllToRight = () => { setRightStaff(prev => [...prev, ...leftStaff]); setLeftStaff([]); setHasChanges(true); };
  const moveAllToLeft = () => { setLeftStaff(prev => [...prev, ...rightStaff]); setRightStaff([]); setHasChanges(true); };

  const handleSubmit = () => onSubmit({ order_id: order.order_id, staff_usernames: rightStaff.map(s => s.username) });
  const isInitial = () => JSON.stringify([...rightStaff.map(s => s.username)].sort()) === JSON.stringify([...initialRightStaff].sort());

  const filteredLeft = filterStaff(leftStaff, leftSearch);
  const filteredRight = filterStaff(rightStaff, rightSearch);

  const StaffCard = ({ staff, onAction, actionIcon: ActionIcon, actionLabel }) => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        {staff.image ? (
          <img src={staff.image} alt={staff.full_name || staff.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(staff.full_name || staff.name || '?').charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{staff.full_name || staff.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1"><Phone size={10} /> {staff.mobile || '—'}</p>
        </div>
      </div>
      <button onClick={() => onAction(staff)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100" title={actionLabel}>
        <ActionIcon size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );

  const SearchInput = ({ value, onChange, placeholder }) => (
    <div className="relative mb-2">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-100" />
      {value && <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={11} /></button>}
    </div>
  );

  const UserCheck = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
    </svg>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title={`Manage Staff · ${order?.order_name || ''}`} icon={Users} size="3xl" contentClassName="p-5" closeText="Cancel"
      footer={
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">{rightStaff.length} staff assigned</span>
          <button onClick={handleSubmit} disabled={isSubmitting || !hasChanges || isInitial()}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Users size={14} /> {isSubmitting ? 'Updating...' : 'Update Staff'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">Use the arrow buttons to move staff between available and assigned lists.</p>
        <div className="flex flex-col gap-4 lg:flex-row md:flex-row items-stretch">
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-sm p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><UserPlus size={14} className="text-indigo-500" /> Available ({leftStaff.length})</h4>
              {leftStaff.length > 0 && <button onClick={moveAllToRight} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1"><ChevronRight size={14} /> All</button>}
            </div>
            <SearchInput value={leftSearch} onChange={setLeftSearch} placeholder="Search available..." />
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {staffLoading ? Array.from({ length: 3 }).map((_, i) => <StaffCardSkeleton key={i} />) : filteredLeft.length > 0 ? filteredLeft.map(s => <StaffCard key={s.username} staff={s} onAction={moveToRight} actionIcon={ChevronRight} actionLabel="Assign" />) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400"><UserPlus className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />{leftSearch ? 'No matching staff' : 'No available staff'}</div>
              )}
            </div>
          </div>
          <div className="w-16 mx-auto flex flex-col items-center justify-center gap-4 py-4 flex-shrink-0">
            <button onClick={moveAllToRight} disabled={leftStaff.length === 0} className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"><ChevronRight size={20} /></button>
            <button onClick={moveAllToLeft} disabled={rightStaff.length === 0} className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"><ChevronLeft size={20} /></button>
            <div className="text-xs text-gray-400 font-medium text-center">{rightStaff.length} / {allStaff.length}</div>
          </div>
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-sm p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><UserCheck size={14} className="text-green-500" /> Assigned ({rightStaff.length})</h4>
              {rightStaff.length > 0 && <button onClick={moveAllToLeft} className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-semibold flex items-center gap-1"><ChevronLeft size={14} /> All</button>}
            </div>
            <SearchInput value={rightSearch} onChange={setRightSearch} placeholder="Search assigned..." />
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {staffLoading ? Array.from({ length: 2 }).map((_, i) => <StaffCardSkeleton key={i} />) : filteredRight.length > 0 ? filteredRight.map(s => <StaffCard key={s.username} staff={s} onAction={moveToLeft} actionIcon={ChevronLeft} actionLabel="Unassign" />) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400"><UserMinus className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={32} />{rightSearch ? 'No matching staff' : 'No staff assigned'}</div>
              )}
            </div>
          </div>
        </div>
        {hasChanges && !isInitial() && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <RefreshCw size={14} className="text-amber-600 dark:text-amber-400 animate-spin-slow" />
            <p className="text-sm text-amber-700 dark:text-amber-300">You have unsaved changes. Click "Update Staff" to save.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ─── Order Update Modal ─── */
const OrderUpdateModal = ({ order, services, servicesLoading, onClose, onSubmit, isSubmitting, inline = false }) => {
  const { discountTypeOptions } = ConstantOptions();
  const [form, setForm] = useState({
    order_name: order?.order_name || order?.name || '',
    service_id: order?.service_id || '',
    base_price: order?.base_price ?? '',
    tax_rate: order?.tax_rate ?? '',
    tax_value: order?.tax_value ?? '',
    total_fees: order?.total_fees ?? '',
    discount_type: order?.discount_type || 'not applicable',
    discount_percentage: order?.discount_percentage ?? '',
    discount_value: order?.discount_value ?? '',
    fees: order?.fees ?? '',
    partial_payment_allowed: order?.partial_payment_allowed ?? true,
  });

  const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none';
  const readOnlyCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-sm bg-gray-100 dark:bg-gray-600/50 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none';
  const handleNumberKeyPress = (e) => { if (!/[0-9.]/.test(e.key)) e.preventDefault(); };
  const handleNumberChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) })); };

  useEffect(() => {
    const basePrice = Number(form.base_price) || 0;
    const taxRate = Number(form.tax_rate) || 0;
    const discountPercentage = Number(form.discount_percentage) || 0;
    const discountType = form.discount_type;
    const taxValue = parseFloat((basePrice * taxRate / 100).toFixed(2));
    const totalFees = parseFloat((basePrice + taxValue).toFixed(2));
    let discountValue;
    if (discountType === 'percentage') discountValue = parseFloat((totalFees * discountPercentage / 100).toFixed(2));
    else if (discountType === 'flat') discountValue = Number(form.discount_value) || 0;
    else discountValue = 0;
    const fees = parseFloat((totalFees - discountValue).toFixed(2));
    setForm(prev => ({
      ...prev, tax_value: taxValue !== 0 ? taxValue : '', total_fees: totalFees !== 0 ? totalFees : '',
      ...(discountType === 'percentage' ? { discount_value: discountValue !== 0 ? discountValue : '' } : {}),
      ...(discountType === 'not applicable' ? { discount_value: '' } : {}),
      fees: fees !== 0 ? fees : '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.base_price, form.tax_rate, form.discount_type, form.discount_percentage]);

  const handleFlatDiscountChange = (e) => {
    const value = e.target.value;
    const discountValue = value === '' ? 0 : Number(value);
    const totalFees = Number(form.total_fees) || 0;
    const fees = parseFloat((totalFees - discountValue).toFixed(2));
    setForm(prev => ({ ...prev, discount_value: value === '' ? '' : discountValue, fees: fees !== 0 ? fees : '' }));
  };

  const handleServiceSelect = (selected) => {
    if (!selected) { setForm(prev => ({ ...prev, service_id: '' })); return; }
    const svc = services.find(s => s.service_id === selected.value);
    if (svc) {
      setForm(prev => ({
        ...prev, service_id: svc.service_id, base_price: svc.base_price ?? '', tax_rate: svc.tax_rate ?? '',
        discount_type: svc.discount_type || 'not applicable', discount_percentage: svc.discount_percentage ?? '',
        discount_value: svc.discount_type === 'flat' ? (svc.discount_value ?? '') : prev.discount_value,
      }));
    } else { setForm(prev => ({ ...prev, service_id: selected.value })); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form };
    ['base_price', 'tax_rate', 'tax_value', 'total_fees', 'discount_percentage', 'discount_value', 'fees'].forEach(k => { payload[k] = Number(payload[k]); });
    payload.partial_payment_allowed = Boolean(payload.partial_payment_allowed);
    onSubmit(payload);
  };

  const isPercentageDiscount = form.discount_type === 'percentage';
  const isFlatDiscount = form.discount_type === 'flat';
  const isDiscountApplicable = form.discount_type !== 'not applicable';
  const serviceOptions = services.map(s => ({ value: s.service_id, label: s.name }));

  const formContent = (
    <form id="order-update-form-profile" onSubmit={handleSubmit} className="p-6 space-y-8">
      <section>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Order Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Order Name *</label><input required type="text" value={form.order_name} onChange={(e) => setForm(prev => ({ ...prev, order_name: e.target.value }))} className={inputCls} placeholder="Order name" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Service *</label><SelectField options={serviceOptions} value={serviceOptions.find(o => o.value === form.service_id) || null} onChange={handleServiceSelect} placeholder={servicesLoading ? 'Loading services...' : 'Select service...'} isLoading={servicesLoading} /></div>
        </div>
      </section>
      <hr className="border-gray-200 dark:border-gray-700" />
      <section>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1 border-b pb-2 dark:border-gray-700">Pricing &amp; Fees</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Tax Value, Total Fees, and Final Fees are calculated automatically.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Base Price</label><input type="text" name="base_price" value={form.base_price} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} placeholder="0" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tax Rate (%)</label><input type="text" name="tax_rate" value={form.tax_rate} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} className={inputCls} placeholder="0" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">Tax Value <span className="text-xs text-gray-400 font-normal">(auto)</span></label><input type="text" value={form.tax_value} readOnly className={readOnlyCls} placeholder="—" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">Total Fees <span className="text-xs text-gray-400 font-normal">(auto)</span></label><input type="text" value={form.total_fees} readOnly className={readOnlyCls} placeholder="—" /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount Type</label><SelectField options={discountTypeOptions} value={discountTypeOptions.find(o => o.value === form.discount_type) || discountTypeOptions[0]} onChange={(selected) => setForm(prev => ({ ...prev, discount_type: selected?.value || 'not applicable' }))} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Discount %{!isPercentageDiscount && <span className="text-xs text-gray-400 font-normal ml-1">(n/a)</span>}</label><input type="text" name="discount_percentage" value={form.discount_percentage} onKeyPress={handleNumberKeyPress} onChange={handleNumberChange} disabled={!isPercentageDiscount} className={isPercentageDiscount ? inputCls : readOnlyCls} placeholder={isPercentageDiscount ? '0' : '—'} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">Discount Value{isPercentageDiscount && <span className="text-xs text-gray-400 font-normal">(auto)</span>}{!isDiscountApplicable && <span className="text-xs text-gray-400 font-normal">(n/a)</span>}</label><input type="text" name="discount_value" value={form.discount_value} readOnly={!isFlatDiscount} onKeyPress={isFlatDiscount ? handleNumberKeyPress : undefined} onChange={isFlatDiscount ? handleFlatDiscountChange : undefined} className={isFlatDiscount ? inputCls : readOnlyCls} placeholder={isFlatDiscount ? '0' : '—'} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">Final Fees <span className="text-xs text-gray-400 font-normal">(auto)</span></label><input type="text" value={form.fees} readOnly className={`${readOnlyCls} font-semibold text-gray-700 dark:text-gray-200`} placeholder="—" /></div>
        </div>
        {(Number(form.base_price) > 0) && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-sm text-xs text-indigo-700 dark:text-indigo-300 flex flex-wrap gap-x-4 gap-y-1">
            <span>Base <strong>{form.base_price}</strong></span><span>+ Tax <strong>{form.tax_value || 0}</strong></span><span>= Total <strong>{form.total_fees || 0}</strong></span>
            {isDiscountApplicable && <span>− Discount <strong>{form.discount_value || 0}</strong></span>}
            <span className="font-bold">= Final <strong>{form.fees || 0}</strong></span>
          </div>
        )}
      </section>
      <hr className="border-gray-200 dark:border-gray-700" />
      <section>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 dark:border-gray-700">Options</h3>
        <label className="flex items-center gap-3 rounded-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <input type="checkbox" checked={form.partial_payment_allowed} onChange={(e) => setForm(prev => ({ ...prev, partial_payment_allowed: e.target.checked }))} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
          Partial payment allowed
        </label>
      </section>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"><Edit size={14} /> {isSubmitting ? 'Updating...' : 'Update Order'}</button>
      </div>
    </form>
  );

  if (inline) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
        {formContent}
      </div>
    );
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={`Update Order · ${order?.order_name || order?.name || ''}`} icon={Edit} size="3xl" contentClassName="p-0" closeText="Cancel"
      footer={<button type="submit" form="order-update-form-profile" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50"><Edit size={14} /> {isSubmitting ? 'Updating...' : 'Update Order'}</button>}
    >
      {formContent}
    </Modal>
  );
};

/* ─── Order Status Modal ─── */
const OrderStatusModal = ({ order, onClose, onSubmit, isSubmitting }) => {
  const { orderStatusOptions } = ConstantOptions();
  const [form, setForm] = useState({ status: (order?.status || 'created').toString().toLowerCase(), remark: order?.remark || '' });
  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 text-gray-900 placeholder:text-gray-400 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 border border-gray-200 dark:border-gray-700 rounded-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-sm';
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(form); };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Update Status · ${order?.order_name || ''}`} icon={RefreshCw} size="md" contentClassName="p-5" closeText="Cancel"
      footer={<button type="submit" form="order-status-form-profile" disabled={isSubmitting} className="px-5 py-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"><RefreshCw size={14} /> {isSubmitting ? 'Updating...' : 'Update Status'}</button>}
    >
      <form id="order-status-form-profile" onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Status</label><SelectField options={orderStatusOptions} value={orderStatusOptions.find(o => o.value === form.status) || orderStatusOptions[0]} onChange={(selected) => setForm(prev => ({ ...prev, status: selected?.value || 'created' }))} /></div>
        <div><label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Remark</label><textarea value={form.remark} onChange={(e) => setForm(prev => ({ ...prev, remark: e.target.value }))} rows={4} placeholder="Add a status note..." className={inputCls} /></div>
      </form>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function OrderProfile() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Documents
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsFetched, setDocsFetched] = useState(false);
  const [docsPage, setDocsPage] = useState(1);
  const [docsTotal, setDocsTotal] = useState(0);
  const [docsLimit, setDocsLimit] = useState(20);

  // Staff
  const [allStaff, setAllStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const staffFetchedRef = useRef(false);

  // Services
  const [allServices, setAllServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const servicesFetchedRef = useRef(false);

  // Modals
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ─── Data Fetching ─── */
  const fetchOrder = useCallback(async () => {
    setOrderLoading(true);
    try {
      const res = await apiCall(`/api/admin/orders/details/${orderId}`, 'GET');
      const data = await res.json();
      if (data.success) {
        const o = data.data;
        setOrder({
          ...o,
          name: o.order_name,
          assigned_staff: o.assigned_staff || [],
          payments: o.payments || [],
          documents: o.documents || [],
          base_price: Number(o.base_price),
          tax_rate: Number(o.tax_rate),
          tax_value: Number(o.tax_value),
          total_fees: Number(o.total_fees),
          discount_percentage: Number(o.discount_percentage),
          discount_value: Number(o.discount_value),
          fees: Number(o.fees),
          total_paid: Number(o.total_paid),
          due_amount: Number(o.due_amount),
        });
      }
    } catch (err) {
      console.error('Failed to fetch order details', err);
      toast.error('Failed to load order details');
    } finally {
      setOrderLoading(false);
    }
  }, [orderId]);

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await apiCall(`/api/admin/documents/list?order_id=${orderId}&page_no=${docsPage}&limit=${docsLimit}`, 'GET');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data.documents || []);
        setDocsTotal(data.pagination?.total_records || data.pagination?.total || 0);
      }
    } catch {
      toast.error('Failed to fetch documents');
    } finally {
      setDocsLoading(false);
      setDocsFetched(true);
    }
  }, [orderId, docsPage, docsLimit]);

  const ensureStaffFetched = async () => {
    if (!staffFetchedRef.current) {
      setStaffLoading(true);
      try {
        const res = await apiCall('/api/admin/staff/list', 'GET');
        const data = await res.json();
        if (data.success) { setAllStaff(data.data.staffs); staffFetchedRef.current = true; }
      } catch { /* ignore */ } finally { setStaffLoading(false); }
    }
  };

  const ensureServicesFetched = async () => {
    if (!servicesFetchedRef.current) {
      setServicesLoading(true);
      try {
        const res = await apiCall('/api/admin/services/list?limit=100', 'GET');
        const data = await res.json();
        if (data.success) { setAllServices(data.data.services || []); servicesFetchedRef.current = true; }
      } catch { /* ignore */ } finally { setServicesLoading(false); }
    }
  };

  const lastFetchRef = useRef(null);
  useEffect(() => {
    if (lastFetchRef.current === orderId) return;
    lastFetchRef.current = orderId;
    fetchOrder();
  }, [orderId, fetchOrder]);

  const lastDocsFetchRef = useRef({ page: null, limit: null });
  useEffect(() => {
    if (activeTab !== 'documents') return;
    if (lastDocsFetchRef.current.page === docsPage && lastDocsFetchRef.current.limit === docsLimit && docsFetched) return;
    lastDocsFetchRef.current = { page: docsPage, limit: docsLimit };
    fetchDocuments();
  }, [activeTab, docsPage, docsLimit, fetchDocuments, docsFetched]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    if (activeTab === 'documents') { setDocsFetched(false); await fetchDocuments(); }
    setRefreshing(false);
  };

  /* ─── Modal Handlers ─── */
  const openStaffModal = () => { ensureStaffFetched(); setStaffModalOpen(true); };

  const openStatusModal = () => { setStatusModalOpen(true); };

  const handleUpdateStaff = async (payload) => {
    setSaving(true);
    try {
      const res = await apiCall('/api/admin/orders/assign/update', 'PUT', payload);
      const data = await res.json();
      if (data.success) { toast.success('Staff assignments updated'); setStaffModalOpen(false); fetchOrder(); }
      else toast.error(data.message || 'Failed to update staff');
    } catch { toast.error('An error occurred.'); } finally { setSaving(false); }
  };

  const handleUpdateOrder = async (payload) => {
    setSaving(true);
    try {
      const res = await apiCall(`/api/admin/orders/update/${orderId}`, 'PUT', payload);
      const data = await res.json();
      if (data.success) { toast.success('Order updated successfully'); setActiveTab('basic'); fetchOrder(); }
      else toast.error(data.message || 'Failed to update order');
    } catch { toast.error('An error occurred.'); } finally { setSaving(false); }
  };

  const handleUpdateStatus = async (payload) => {
    setSaving(true);
    try {
      const res = await apiCall(`/api/admin/orders/status/${orderId}`, 'PUT', payload);
      const data = await res.json();
      if (data.success) { toast.success('Status updated successfully'); setStatusModalOpen(false); fetchOrder(); }
      else toast.error(data.message || 'Failed to update status');
    } catch { toast.error('An error occurred.'); } finally { setSaving(false); }
  };

  const handleDownloadStatement = async () => {
    let toastId;
    try {
      toastId = toast.loading('Generating statement...');
      const res = await apiCall(`/api/admin/orders/download-payments/${orderId}`, 'GET');
      const data = await res.json();
      if (data.success && data.data?.url) {
        const fileRes = await fetch(data.data.url);
        const blob = await fileRes.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = data.data.filename || 'statement.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
        toast.dismiss(toastId);
      } else toast.error(data.message || 'Failed to download statement', { id: toastId });
    } catch { toast.error('An error occurred while downloading', { id: toastId }); }
  };

  const handleDownloadDocument = async (doc) => {
    const fileName = doc.file_name || doc.document_name || doc.name || 'document';
    const toastId = toast.loading('Downloading...');
    try {
      const res = await apiCall(`/api/admin/documents/download/${doc.document_id}?source=order`, 'GET');
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      toast.dismiss(toastId);
    } catch { toast.error('Failed to download file', { id: toastId }); }
  };

  /* ─── Document columns ─── */
  const docColumns = [
    { key: 'serial_no', label: '#', className: 'w-[48px] !max-w-[48px]', headerClassName: 'w-[48px]', render: (_r, i) => <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{(docsPage - 1) * docsLimit + i + 1}</span> },
    { key: 'name', label: 'Document', className: '!max-w-none', render: (row) => (
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">{getDocumentIcon(row)}</div>
        <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">{row.name || row.document_name || 'Document'}</p>
      </div>
    )},
    { key: 'file_type', label: 'Type', className: 'w-[110px] !max-w-[110px]', headerClassName: 'w-[110px]', render: (row) => {
      const info = getFileTypeInfo(row); const ext = getDocumentExtension(row);
      return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${info.color}`}>{info.label}{ext && <span className="opacity-60 uppercase">.{ext}</span>}</span>;
    }},
    { key: 'size', label: 'Size', className: 'w-[90px] !max-w-[90px]', headerClassName: 'w-[90px]', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300">{formatFileSize(row.size)}</span> },
    { key: 'actions_inline', label: 'Actions', className: 'w-[90px] !max-w-[90px]', headerClassName: 'w-[90px]', render: (row) => (
      <div className="flex items-center gap-0.5">
        {row.file_url && (
          <>
            <button onClick={(e) => { e.stopPropagation(); window.open(row.file_url, '_blank'); }} title="View" className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"><ExternalLink size={15} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDownloadDocument(row); }} title="Download" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"><Download size={15} /></button>
          </>
        )}
      </div>
    )},
  ];

  /* ─── Payment columns ─── */
  const paymentColumns = [
    { key: 'serial_no', label: '#', className: 'w-[48px] !max-w-[48px]', headerClassName: 'w-[48px]', render: (_r, i) => <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{i + 1}</span> },
    { key: 'payment_id', label: 'Payment ID', className: 'w-[140px] !max-w-[140px]', headerClassName: 'w-[140px]', render: (row) => <span className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate">{row.payment_id}</span> },
    { key: 'amount', label: 'Amount', className: 'w-[100px] !max-w-[100px]', headerClassName: 'w-[100px]', render: (row) => <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(row.amount)}</span> },
    { key: 'status', label: 'Status', className: 'w-[100px] !max-w-[100px]', headerClassName: 'w-[100px]', render: (row) => {
      const cls = PAYMENT_STATUS_MAP[row.status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{(row.status || 'unknown').replace(/\b\w/g, l => l.toUpperCase())}</span>;
    }},
    { key: 'utr', label: 'UTR', className: '!max-w-none', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{row.utr || '—'}</span> },
    { key: 'gateway', label: 'Gateway', className: 'w-[100px] !max-w-[100px]', headerClassName: 'w-[100px]', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300">{row.gateway || '—'}</span> },
    { key: 'create_date', label: 'Date', className: 'w-[100px] !max-w-[100px]', headerClassName: 'w-[100px]', render: (row) => <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{row.create_date ? new Date(row.create_date).toLocaleDateString() : '—'}</span> },
  ];

  /* ─── Tabs ─── */
  const tabs = [
    { id: 'basic', label: 'Basic', icon: Briefcase },
    { id: 'client', label: 'Client', icon: User },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'staffs', label: 'Staffs', icon: Users },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'status', label: 'Status', icon: RefreshCw },
    { id: 'update', label: 'Update Order', icon: Edit },
    { id: 'upload', label: 'Upload Docs', icon: Upload },
  ];

  /* ─── Render ─── */
  if (!order && !orderLoading) {
    return (
      <ManagementHub title="Order Not Found" description="The order you are looking for does not exist." accent="indigo">
        <Button onClick={() => navigate('/orders')} variant="primary" className="mt-4"><ArrowLeft size={16} className="mr-2" /> Back to Orders</Button>
      </ManagementHub>
    );
  }

  return (
    <div>
      {/* ─── Sticky Header + Tabs ─── */}
      <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-sm">
        {/* Header */}
        {order && (
          <div className="px-2 pt-3 pb-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Briefcase size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 leading-tight truncate">{order.order_name}</h2>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1"><Tag size={11} className="text-indigo-400" /> {order.service_name}</span>
                    <span className="flex items-center gap-1"><User size={11} className="text-indigo-400" /> {order.client_name || order.client_username}</span>
                    <span className="font-mono text-gray-400 dark:text-gray-500">ID: {order.order_id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RefreshButton type="button" loading={refreshing} onClick={handleRefresh} title="Refresh" />
                <Button variant="outline" onClick={() => navigate('/orders')} className="flex items-center gap-2 text-sm py-1.5"><ArrowLeft size={16} /> Back</Button>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        {!orderLoading && (
          <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 px-2 overflow-x-auto hide-scrollbar">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { if (tab.id === 'upload') { navigate(`/orders/${orderId}/upload-documents`); return; } setActiveTab(tab.id); if (tab.id === 'update') ensureServicesFetched(); }}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Content ─── */}
      <div className="px-2 py-4">
        {/* Loading State */}
        {orderLoading && <PageContentSkeleton rows={6} columns={3} />}

        {/* Content */}
        {!orderLoading && order && (
          <AnimatePresence mode="wait">

            {/* ─── BASIC TAB ─── */}
            {activeTab === 'basic' && (
              <motion.div key="basic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><Briefcase className="text-indigo-500" size={20} /> Order Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem icon={Hash} label="Order ID" value={order.order_id} />
                    <InfoItem icon={FileText} label="Order Name" value={order.order_name} />
                    <InfoItem icon={Tag} label="Service" value={order.service_name} />
                    <InfoItem icon={User} label="Client" value={order.client_name || order.client_username} />
                    <InfoItem icon={Calendar} label="Created" value={new Date(order.create_date).toLocaleString()} />
                    <InfoItem icon={Calendar} label="Modified" value={order.modify_date ? new Date(order.modify_date).toLocaleString() : 'N/A'} />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><IndianRupee className="text-indigo-500" size={20} /> Financial Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem icon={IndianRupee} label="Base Price" value={formatCurrency(order.base_price)} />
                    <InfoItem icon={IndianRupee} label="Tax Rate" value={`${order.tax_rate}%`} />
                    <InfoItem icon={IndianRupee} label="Tax Value" value={formatCurrency(order.tax_value)} />
                    <InfoItem icon={IndianRupee} label="Total Fees" value={formatCurrency(order.total_fees)} />
                    <InfoItem icon={Tag} label="Discount Type" value={(order.discount_type || 'N/A').replace(/\b\w/g, l => l.toUpperCase())} />
                    <InfoItem icon={IndianRupee} label="Discount" value={order.discount_type === 'percentage' ? `${order.discount_percentage}% (${formatCurrency(order.discount_value)})` : order.discount_type === 'flat' ? formatCurrency(order.discount_value) : 'N/A'} />
                    <InfoItem icon={IndianRupee} label="Final Fees" value={<span className="font-bold">{formatCurrency(order.fees)}</span>} />
                    <InfoItem icon={IndianRupee} label="Total Paid" value={<span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(order.total_paid)}</span>} />
                    <InfoItem icon={IndianRupee} label="Due Amount" value={<span className={order.due_amount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>{formatCurrency(order.due_amount)}</span>} />
                  </div>
                </div>

                {/* Firm / Business Details */}
                {order.firm ? (
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><Building2 className="text-indigo-500" size={20} /> Business / Firm Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <InfoItem icon={Building2} label="Firm Name" value={order.firm.name} />
                      <InfoItem icon={Tag} label="Firm Type" value={(order.firm.type || 'N/A').replace(/\b\w/g, l => l.toUpperCase())} />
                      <InfoItem icon={Hash} label="PAN No." value={order.firm.pan_no} />
                      <InfoItem icon={Hash} label="GST No." value={order.firm.gst_no} />
                      {order.firm.vat_no && <InfoItem icon={Hash} label="VAT No." value={order.firm.vat_no} />}
                      {order.firm.tan_no && <InfoItem icon={Hash} label="TAN No." value={order.firm.tan_no} />}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2"><Building2 className="text-indigo-500" size={20} /> Business / Firm Details</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No firm/business associated with this order.</p>
                  </div>
                )}

                {order.remark && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2"><FileText className="text-indigo-500" size={20} /> Remark</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{order.remark}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── CLIENT TAB ─── */}
            {activeTab === 'client' && (
              <motion.div key="client" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                {/* Client Profile Card */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <div className="flex flex-col sm:flex-row items-start gap-6">
                    {order.client_image ? (
                      <img src={order.client_image} alt={order.client_name} className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-700 shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
                        {(order.client_first_name || order.client_name || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{order.client_name}</h3>
                        {order.client_status !== undefined && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${order.client_status === 1 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                            {order.client_status === 1 ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">@{order.client_username}</p>
                      <div className="flex flex-wrap gap-3">
                        {order.client_email && (
                          <a href={`mailto:${order.client_email}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Mail size={14} className="text-indigo-400" /> {order.client_email}
                          </a>
                        )}
                        {order.client_mobile && (
                          <a href={`tel:${order.client_mobile}`} className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            <Phone size={14} className="text-indigo-400" /> {order.client_mobile}
                          </a>
                        )}
                      </div>
                    </div>
                    <button onClick={() => navigate(`/clients/${order.client_username}`)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-sm font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shrink-0">
                      <User size={14} /> View Full Profile
                    </button>
                  </div>
                </div>

                {/* Client Details Grid */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><User className="text-indigo-500" size={20} /> Personal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <InfoItem icon={User} label="First Name" value={order.client_first_name} />
                    <InfoItem icon={User} label="Middle Name" value={order.client_middle_name} />
                    <InfoItem icon={User} label="Last Name" value={order.client_last_name} />
                    <InfoItem icon={Mail} label="Email" value={order.client_email} />
                    <InfoItem icon={Phone} label="Mobile" value={order.client_mobile} />
                    <InfoItem icon={Hash} label="Username" value={order.client_username} />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2"><Phone className="text-indigo-500" size={20} /> Quick Contact</h3>
                  <div className="flex flex-wrap gap-3">
                    {order.client_mobile && (
                      <a href={`tel:${order.client_mobile}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
                        <Phone size={14} /> Call Client
                      </a>
                    )}
                    {order.client_mobile && (
                      <a href={`https://wa.me/${order.client_mobile.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                        <Phone size={14} /> WhatsApp
                      </a>
                    )}
                    {order.client_email && (
                      <a href={`mailto:${order.client_email}`} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                        <Mail size={14} /> Send Email
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── DOCUMENTS TAB ─── */}
            {activeTab === 'documents' && (
              <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                {docsLoading ? <PageContentSkeleton rows={5} columns={3} /> : documents.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <FileText className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={48} />
                    <p className="text-lg text-gray-500 dark:text-gray-400">No documents found</p>
                    <button onClick={() => navigate(`/orders/${orderId}/upload-documents`)} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"><Upload size={14} /> Upload Documents</button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                      <ManagementTable columns={docColumns} rows={documents} rowKey={(row) => row.document_id || row.file_url} accent="emerald" showActionsColumn={false} />
                    </div>
                    {docsTotal > 0 && <PaginationComponent currentPage={docsPage} totalItems={docsTotal} itemsPerPage={docsLimit} onPageChange={setDocsPage} onLimitChange={(l) => { setDocsLimit(l); setDocsPage(1); }} availableLimits={[10, 20, 50]} />}
                  </>
                )}
              </motion.div>
            )}

            {/* ─── STAFFS TAB ─── */}
            {activeTab === 'staffs' && (
              <motion.div key="staffs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Users className="text-indigo-500" size={20} /> Assigned Staff ({order.assigned_staff?.length || 0})</h3>
                    <button onClick={openStaffModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors">
                      <Users size={14} /> Manage Staff
                    </button>
                  </div>
                  {order.assigned_staff && order.assigned_staff.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {order.assigned_staff.map(s => (
                        <div key={s.username} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">{(s.name || s.username || '?').charAt(0).toUpperCase()}</div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">{s.mobile ? <><Phone size={11} /> {s.mobile}</> : 'No mobile'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserPlus className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={48} />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No staff assigned</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Click "Manage Staff" to assign staff to this order.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── PAYMENTS TAB ─── */}
            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Fees</p>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(order.fees)}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 p-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">Total Paid</p>
                    <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(order.total_paid)}</p>
                  </div>
                  <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-4 text-center ${order.due_amount > 0 ? 'border-amber-100 dark:border-amber-900/30' : 'border-emerald-100 dark:border-emerald-900/30'}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${order.due_amount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>Due Amount</p>
                    <p className={`text-xl font-bold ${order.due_amount > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>{formatCurrency(order.due_amount)}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleDownloadStatement} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 text-sm font-semibold text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"><Download size={14} /> Download Statement</button>
                </div>

                {order.payments && order.payments.length > 0 ? (
                  <div className="rounded-xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <ManagementTable columns={paymentColumns} rows={order.payments} rowKey="payment_id" accent="indigo" showActionsColumn={false} />
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <CreditCard className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={48} />
                    <p className="text-lg text-gray-500 dark:text-gray-400">No payments recorded</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── STATUS TAB ─── */}
            {activeTab === 'status' && (
              <motion.div key="status" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2"><RefreshCw className="text-indigo-500" size={20} /> Order Status</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Current Status:</div>
                    <StatusBadge status={order.status} />
                  </div>
                  {order.remark && (
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Remark</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{order.remark}</p>
                    </div>
                  )}
                  <button onClick={openStatusModal} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
                    <RefreshCw size={14} /> Update Status
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── UPDATE ORDER TAB ─── */}
            {activeTab === 'update' && (
              <motion.div key="update" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                <OrderUpdateModal
                  order={order}
                  services={allServices}
                  servicesLoading={servicesLoading}
                  onClose={() => setActiveTab('basic')}
                  onSubmit={handleUpdateOrder}
                  isSubmitting={saving}
                  inline
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ── STAFF MANAGEMENT MODAL ── */}
      <AnimatePresence>
        {staffModalOpen && order && (
          <StaffManagementModal order={order} allStaff={allStaff} staffLoading={staffLoading} onClose={() => setStaffModalOpen(false)} onSubmit={handleUpdateStaff} isSubmitting={saving} />
        )}
      </AnimatePresence>

      {/* ── UPDATE STATUS MODAL ── */}
      <AnimatePresence>
        {statusModalOpen && order && (
          <OrderStatusModal order={order} onClose={() => setStatusModalOpen(false)} onSubmit={handleUpdateStatus} isSubmitting={saving} />
        )}
      </AnimatePresence>
    </div>
  );
}
