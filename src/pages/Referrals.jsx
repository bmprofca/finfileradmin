import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Plus, FileText, CheckCircle, XCircle, Clock,
  Search, X, Eye, Users, Edit, Trash2, RefreshCcw, User, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import SelectField from '../components/common/SelectField';
import AsyncSelectField from '../components/common/AsyncSelectField';
import { PageContentSkeleton } from '../components/SkeletonComponent';
import { apiCall } from '../utils/apiCall';

// ─── Enums (matching DB) ───────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const BONUS_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'credited', label: 'Credited' },
  { value: 'cancelled', label: 'Cancelled' },
];

const BONUS_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'percentage', label: 'Percentage' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fullName = (person) => {
  if (!person) return 'N/A';
  return [person.first_name, person.middle_name, person.last_name].filter(Boolean).join(' ') || person.username || 'N/A';
};

const formatDate = (d) => {
  if (!d) return 'N/A';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

const StatusBadge = ({ status }) => {
  const map = {
    pending: { icon: Clock, cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50' },
    completed: { icon: CheckCircle, cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50' },
    rejected: { icon: XCircle, cls: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50' },
  };
  const conf = map[status] || map.pending;
  const Icon = conf.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${conf.cls}`}>
      <Icon size={10} /> {status || 'pending'}
    </span>
  );
};

const BonusStatusBadge = ({ status }) => {
  const map = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    credited: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    cancelled: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border capitalize whitespace-nowrap ${map[status] || map.pending}`}>
      {status || 'pending'}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-3 py-2">
    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/80 dark:bg-gray-700/80 border border-gray-200 dark:border-gray-600">
      <Icon size={14} className="dark:text-gray-300" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-none mb-1">{label}</div>
      <div className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-snug break-words">{value ?? 'N/A'}</div>
    </div>
  </div>
);

const PersonCard = ({ person, username, roleLabel }) => (
  <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 p-3">
    {person?.image ? (
      <img src={person.image} alt={username} className="w-11 h-11 rounded-full object-cover shrink-0" />
    ) : (
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
        <User size={18} />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{roleLabel}</p>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{fullName(person)}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{username}</p>
      {person?.email && <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{person.email}</p>}
    </div>
    {typeof person?.status !== 'undefined' && (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${person.status
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50'
        : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'}`}>
        {person.status ? 'Active' : 'Inactive'}
      </span>
    )}
  </div>
);

const filterSelectStyles = {
  control: (provided, state, theme) => {
    const isDark = theme === 'dark';
    return {
      ...provided,
      minHeight: '42px',
      backgroundColor: isDark ? '#111827' : '#f9fafb',
      borderColor: state.isFocused ? '#6366f1' : (isDark ? '#374151' : '#e5e7eb'),
      boxShadow: state.isFocused ? '0 0 0 4px rgba(99, 102, 241, 0.1)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? '#6366f1' : (isDark ? '#4b5563' : '#d1d5db'),
      },
    };
  },
};

const inputClass = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm dark:text-gray-100";
const labelClass = "block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5";

// ─── View Referral Modal ────────────────────────────────────────────────────────

const ViewReferralModal = ({ referral, onClose, onEdit }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Referral Details"
    icon={Gift}
    size="2xl"
    contentClassName="p-5 space-y-4"
    footer={
      <button onClick={() => onEdit(referral)} className="px-5 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2">
        <Edit size={16} /> Edit Referral
      </button>
    }
  >
    <div className="flex items-center justify-between pb-4 border-b dark:border-gray-700">
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Referral #{referral.referral_id}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">Code used: {referral.referral_code_used || 'N/A'}</p>
      </div>
      <StatusBadge status={referral.status} />
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <PersonCard person={referral.referrer} username={referral.referrer_username} roleLabel="Referrer" />
      <PersonCard person={referral.referred} username={referral.referred_username} roleLabel="Referred User" />
    </div>

    <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Offer</p>
      <p className="text-sm text-gray-700 dark:text-gray-300">{referral.offer_name_snapshot || 'No offer snapshot'}</p>
    </div>

    <div>
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
        <Gift className="text-indigo-500 dark:text-indigo-400" size={15} /> Bonus Details
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <InfoItem icon={Users} label="Referrer Bonus" value={`${referral.referrer_bonus_amount} (${referral.referrer_bonus_type})`} />
        <InfoItem
          icon={CheckCircle}
          label="Referrer Bonus Status"
          value={<BonusStatusBadge status={referral.referrer_bonus_status} />}
        />
        <InfoItem icon={Users} label="Referee Bonus" value={`${referral.referee_bonus_amount} (${referral.referee_bonus_type})`} />
        <InfoItem
          icon={CheckCircle}
          label="Referee Bonus Status"
          value={<BonusStatusBadge status={referral.referee_bonus_status} />}
        />
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      <InfoItem icon={FileText} label="Referred Date" value={formatDate(referral.referred_date)} />
      <InfoItem icon={FileText} label="Last Modified" value={formatDate(referral.modify_date)} />
    </div>
  </Modal>
);

// ─── Create / Edit Referral Modal ───────────────────────────────────────────────

const ReferralFormModal = ({ referral, onClose, onSubmit, isSubmitting }) => {
  const isEdit = !!referral;
  const [form, setForm] = useState({
    referrer_username: referral?.referrer_username || '',
    referred_username: referral?.referred_username || '',
    refer_offer_id: referral?.refer_offer_id ?? '',
    referral_code_used: referral?.referral_code_used || '',
    offer_name_snapshot: referral?.offer_name_snapshot || '',
    referrer_bonus_type: referral?.referrer_bonus_type || 'fixed',
    referrer_bonus_amount: referral?.referrer_bonus_amount ?? '',
    referee_bonus_type: referral?.referee_bonus_type || 'fixed',
    referee_bonus_amount: referral?.referee_bonus_amount ?? '',
    referrer_bonus_status: referral?.referrer_bonus_status || 'pending',
    referee_bonus_status: referral?.referee_bonus_status || 'pending',
    status: referral?.status || 'pending',
  });

  const [referrerObj, setReferrerObj] = useState(referral?.referrer || null);
  const [referredObj, setReferredObj] = useState(referral?.referred || null);
  const [offerObj, setOfferObj] = useState(null);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    if (!form.referrer_username || !form.referred_username) {
      toast.error('Referrer and Referred usernames are required.');
      return;
    }
    if (isEdit) {
      // Update endpoint only accepts these fields; status fields go through update-status
      const {
        referrer_username, referred_username, refer_offer_id, referral_code_used,
        offer_name_snapshot, referrer_bonus_type, referrer_bonus_amount,
        referee_bonus_type, referee_bonus_amount,
      } = form;
      onSubmit({
        referrer_username, referred_username, refer_offer_id: Number(refer_offer_id) || 0,
        referral_code_used, offer_name_snapshot, referrer_bonus_type,
        referrer_bonus_amount: Number(referrer_bonus_amount) || 0,
        referee_bonus_type, referee_bonus_amount: Number(referee_bonus_amount) || 0,
      });
    } else {
      onSubmit({
        ...form,
        refer_offer_id: Number(form.refer_offer_id) || 0,
        referrer_bonus_amount: Number(form.referrer_bonus_amount) || 0,
        referee_bonus_amount: Number(form.referee_bonus_amount) || 0,
      });
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Referral' : 'Add Referral'}
      icon={Gift}
      size="2xl"
      contentClassName="p-5 space-y-4"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Referral'}
          </button>
        </div>
      }
    >
      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Users className="text-indigo-500 dark:text-indigo-400" size={15} /> Parties
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Referrer Username *</label>
            <AsyncSelectField
              fetchUrl="/api/admin/clients/list"
              dataKey="clients"
              labelKey={(client) => `${client.full_name || fullName(client)} (${client.username})`}
              valueKey="username"
              value={form.referrer_username}
              onChange={(val, selected) => {
                update('referrer_username', val || '');
                setReferrerObj(selected || null);
              }}
              placeholder="Search referrer..."
            />
            {referrerObj && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">{referrerObj.full_name || fullName(referrerObj)}</div>
                <div>Email: {referrerObj.email || 'N/A'}</div>
                <div>Mobile: {referrerObj.mobile || 'N/A'}</div>
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Referred Username *</label>
            <AsyncSelectField
              fetchUrl="/api/admin/clients/list"
              dataKey="clients"
              labelKey={(client) => `${client.full_name || fullName(client)} (${client.username})`}
              valueKey="username"
              value={form.referred_username}
              onChange={(val, selected) => {
                update('referred_username', val || '');
                setReferredObj(selected || null);
              }}
              placeholder="Search referred user..."
            />
            {referredObj && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">{referredObj.full_name || fullName(referredObj)}</div>
                <div>Email: {referredObj.email || 'N/A'}</div>
                <div>Mobile: {referredObj.mobile || 'N/A'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Tag className="text-indigo-500 dark:text-indigo-400" size={15} /> Offer
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Offer ID</label>
            <AsyncSelectField
              fetchUrl="/api/admin/refer-offers/list"
              labelKey={(offer) => `${offer.offer_name} (${offer.offer_code})`}
              valueKey="id"
              value={form.refer_offer_id}
              onChange={(val, selected) => {
                update('refer_offer_id', val || '');
                setOfferObj(selected || null);
                if (selected) {
                  update('referral_code_used', selected.offer_code || '');
                  update('offer_name_snapshot', selected.offer_name || '');
                  update('referrer_bonus_type', selected.referrer_bonus_type || 'fixed');
                  update('referrer_bonus_amount', selected.referrer_bonus_value || 0);
                  update('referee_bonus_type', selected.referee_bonus_type || 'fixed');
                  update('referee_bonus_amount', selected.referee_bonus_value || 0);
                }
              }}
              placeholder="Search offer..."
            />
            {offerObj && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-[11px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">{offerObj.offer_name}</div>
                <div>Referrer Bonus: {offerObj.referrer_bonus_value} ({offerObj.referrer_bonus_type})</div>
                <div>Referee Bonus: {offerObj.referee_bonus_value} ({offerObj.referee_bonus_type})</div>
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Referral Code Used</label>
            <input className={inputClass} value={form.referral_code_used} onChange={(e) => update('referral_code_used', e.target.value)} placeholder="e.g. WELCOME10" />
          </div>
          <div>
            <label className={labelClass}>Offer Name Snapshot</label>
            <input className={inputClass} value={form.offer_name_snapshot} onChange={(e) => update('offer_name_snapshot', e.target.value)} placeholder="e.g. Referral Welcome Bonus" />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <Gift className="text-indigo-500 dark:text-indigo-400" size={15} /> Bonus Configuration
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referrer</p>
            <div>
              <label className={labelClass}>Bonus Type</label>
              <SelectField
                value={BONUS_TYPE_OPTIONS.find((o) => o.value === form.referrer_bonus_type)}
                onChange={(s) => update('referrer_bonus_type', s?.value || 'fixed')}
                options={BONUS_TYPE_OPTIONS}
                styles={filterSelectStyles}
              />
            </div>
            <div>
              <label className={labelClass}>Bonus Amount</label>
              <input type="number" className={inputClass} value={form.referrer_bonus_amount} onChange={(e) => update('referrer_bonus_amount', e.target.value)} placeholder="0" />
            </div>
            {!isEdit && (
              <div>
                <label className={labelClass}>Bonus Status</label>
                <SelectField
                  value={BONUS_STATUS_OPTIONS.find((o) => o.value === form.referrer_bonus_status)}
                  onChange={(s) => update('referrer_bonus_status', s?.value || 'pending')}
                  options={BONUS_STATUS_OPTIONS}
                  styles={filterSelectStyles}
                />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Referred User</p>
            <div>
              <label className={labelClass}>Bonus Type</label>
              <SelectField
                value={BONUS_TYPE_OPTIONS.find((o) => o.value === form.referee_bonus_type)}
                onChange={(s) => update('referee_bonus_type', s?.value || 'fixed')}
                options={BONUS_TYPE_OPTIONS}
                styles={filterSelectStyles}
              />
            </div>
            <div>
              <label className={labelClass}>Bonus Amount</label>
              <input type="number" className={inputClass} value={form.referee_bonus_amount} onChange={(e) => update('referee_bonus_amount', e.target.value)} placeholder="0" />
            </div>
            {!isEdit && (
              <div>
                <label className={labelClass}>Bonus Status</label>
                <SelectField
                  value={BONUS_STATUS_OPTIONS.find((o) => o.value === form.referee_bonus_status)}
                  onChange={(s) => update('referee_bonus_status', s?.value || 'pending')}
                  options={BONUS_STATUS_OPTIONS}
                  styles={filterSelectStyles}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {!isEdit && (
        <div>
          <label className={labelClass}>Overall Status</label>
          <SelectField
            value={STATUS_OPTIONS.find((o) => o.value === form.status)}
            onChange={(s) => update('status', s?.value || 'pending')}
            options={STATUS_OPTIONS}
            styles={filterSelectStyles}
          />
        </div>
      )}

      {isEdit && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Status and bonus statuses are managed separately via the "Update Status" action.
        </p>
      )}
    </Modal>
  );
};

// ─── Update Status Modal ────────────────────────────────────────────────────────

const UpdateStatusModal = ({ referral, onClose, onSubmit, isSubmitting }) => {
  const [status, setStatus] = useState(referral.status || 'pending');
  const [referrerBonusStatus, setReferrerBonusStatus] = useState(referral.referrer_bonus_status || 'pending');
  const [refereeBonusStatus, setRefereeBonusStatus] = useState(referral.referee_bonus_status || 'pending');

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Update Referral Status"
      icon={RefreshCcw}
      size="lg"
      contentClassName="p-5 space-y-4"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Cancel
          </button>
          <button
            onClick={() => onSubmit({ status, referrer_bonus_status: referrerBonusStatus, referee_bonus_status: refereeBonusStatus })}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-60"
          >
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      }
    >
      <div className="text-xs text-gray-500 dark:text-gray-400 pb-2 border-b dark:border-gray-700">
        Referral #{referral.referral_id} &middot; {referral.referrer_username} &rarr; {referral.referred_username}
      </div>
      <div>
        <label className={labelClass}>Overall Status</label>
        <SelectField value={STATUS_OPTIONS.find((o) => o.value === status)} onChange={(s) => setStatus(s?.value || 'pending')} options={STATUS_OPTIONS} styles={filterSelectStyles} />
      </div>
      <div>
        <label className={labelClass}>Referrer Bonus Status</label>
        <SelectField value={BONUS_STATUS_OPTIONS.find((o) => o.value === referrerBonusStatus)} onChange={(s) => setReferrerBonusStatus(s?.value || 'pending')} options={BONUS_STATUS_OPTIONS} styles={filterSelectStyles} />
      </div>
      <div>
        <label className={labelClass}>Referee Bonus Status</label>
        <SelectField value={BONUS_STATUS_OPTIONS.find((o) => o.value === refereeBonusStatus)} onChange={(s) => setRefereeBonusStatus(s?.value || 'pending')} options={BONUS_STATUS_OPTIONS} styles={filterSelectStyles} />
      </div>
    </Modal>
  );
};

// ─── Delete Confirm Modal ────────────────────────────────────────────────────────

const DeleteConfirmModal = ({ referral, onClose, onConfirm, isSubmitting }) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title="Delete Referral"
    icon={Trash2}
    size="sm"
    contentClassName="p-5 space-y-4"
    footer={
      <div className="flex justify-end gap-2 w-full">
        <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-60"
        >
          {isSubmitting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    }
  >
    <p className="text-sm text-gray-600 dark:text-gray-300">
      Are you sure you want to delete referral <span className="font-semibold">#{referral.referral_id}</span> between{' '}
      <span className="font-semibold">{referral.referrer_username}</span> and{' '}
      <span className="font-semibold">{referral.referred_username}</span>? This action cannot be undone.
    </p>
  </Modal>
);

// ─── Active Filter Pills ──────────────────────────────────────────────────────

const ActiveFilters = ({ searchTerm, statusFilter, referrerBonusFilter, refereeBonusFilter, onClearSearch, onClearStatus, onClearReferrerBonus, onClearRefereeBonus, onClearAll }) => {
  const hasFilters = searchTerm || statusFilter || referrerBonusFilter || refereeBonusFilter;
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Active filters:</span>
      {searchTerm && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 text-xs font-medium text-indigo-700 dark:text-indigo-400">
          Search: "{searchTerm}"
          <button onClick={onClearSearch} className="ml-0.5 hover:text-indigo-900 dark:hover:text-indigo-200"><X size={11} /></button>
        </span>
      )}
      {statusFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-xs font-medium text-blue-700 dark:text-blue-400 capitalize">
          Status: {statusFilter}
          <button onClick={onClearStatus} className="ml-0.5 hover:text-blue-900 dark:hover:text-blue-200"><X size={11} /></button>
        </span>
      )}
      {referrerBonusFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 text-xs font-medium text-purple-700 dark:text-purple-400 capitalize">
          Referrer Bonus: {referrerBonusFilter}
          <button onClick={onClearReferrerBonus} className="ml-0.5 hover:text-purple-900 dark:hover:text-purple-200"><X size={11} /></button>
        </span>
      )}
      {refereeBonusFilter && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 text-xs font-medium text-teal-700 dark:text-teal-400 capitalize">
          Referee Bonus: {refereeBonusFilter}
          <button onClick={onClearRefereeBonus} className="ml-0.5 hover:text-teal-900 dark:hover:text-teal-200"><X size={11} /></button>
        </span>
      )}
      <button onClick={onClearAll} className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline underline-offset-2 transition-colors">
        Clear all
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [referrerBonusFilter, setReferrerBonusFilter] = useState('');
  const [refereeBonusFilter, setRefereeBonusFilter] = useState('');

  // Modals
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState(null);
  const [statusReferral, setStatusReferral] = useState(null);
  const [deletingReferral, setDeletingReferral] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const lastFetchRef = useRef(null);
  const activeFetchRef = useRef(null);

  // Debounce search input — 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, referrerBonusFilter, refereeBonusFilter]);

  // ─── Fetch ──────────────────────────────────────────────────────────────────

  const fetchReferrals = useCallback(async ({ silent = false, force = false } = {}) => {
    const params = new URLSearchParams({
      page_no: currentPage,
      limit: itemsPerPage,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (statusFilter) params.set('status', statusFilter);
    if (referrerBonusFilter) params.set('referrer_bonus_status', referrerBonusFilter);
    if (refereeBonusFilter) params.set('referee_bonus_status', refereeBonusFilter);

    const requestKey = params.toString();
    if (activeFetchRef.current === requestKey) {
      setRefreshing(false);
      return;
    }
    if (!force && lastFetchRef.current === requestKey) return;

    activeFetchRef.current = requestKey;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const response = await apiCall(`/api/admin/referrals/list?${params.toString()}`);
      const json = await response.json();
      if (json.success) {
        setReferrals(json.data || []);
        setTotalReferrals(json.pagination?.total || 0);
        lastFetchRef.current = requestKey;
      } else {
        toast.error(json.message || 'Failed to fetch referrals.');
      }
    } catch {
      toast.error('Error connecting to server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      if (activeFetchRef.current === requestKey) activeFetchRef.current = null;
    }
  }, [currentPage, itemsPerPage, debouncedSearch, statusFilter, referrerBonusFilter, refereeBonusFilter]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleView = (referral) => { setSelectedReferral(referral); setIsViewModalOpen(true); };
  const handleEdit = (referral) => { setEditingReferral(referral); setIsFormModalOpen(true); setIsViewModalOpen(false); };
  const handleCreateNew = () => { setEditingReferral(null); setIsFormModalOpen(true); };
  const handleRefresh = () => fetchReferrals({ silent: true, force: true });
  const handleLimitChange = (limit) => { setItemsPerPage(limit); setCurrentPage(1); };

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const isEdit = !!editingReferral;
      const endpoint = isEdit
        ? `/api/admin/referrals/update/${editingReferral.referral_id}`
        : '/api/admin/referrals/create';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await apiCall(endpoint, method, formData);
      const json = await response.json();
      if (json.success) {
        toast.success(isEdit ? 'Referral updated successfully' : 'Referral created successfully');
        setIsFormModalOpen(false);
        fetchReferrals({ silent: true, force: true });
      } else {
        toast.error(json.message || 'Operation failed.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusSubmit = async (statusPayload) => {
    setIsSubmitting(true);
    try {
      const response = await apiCall(`/api/admin/referrals/update-status/${statusReferral.referral_id}`, 'PUT', statusPayload);
      const json = await response.json();
      if (json.success) {
        toast.success('Status updated successfully');
        setStatusReferral(null);
        fetchReferrals({ silent: true, force: true });
      } else {
        toast.error(json.message || 'Failed to update status.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiCall(`/api/admin/referrals/delete/${deletingReferral.referral_id}`, 'DELETE');
      const json = await response.json();
      if (json.success) {
        toast.success('Referral deleted successfully');
        setDeletingReferral(null);
        fetchReferrals({ silent: true, force: true });
      } else {
        toast.error(json.message || 'Failed to delete referral.');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setReferrerBonusFilter('');
    setRefereeBonusFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = debouncedSearch || statusFilter || referrerBonusFilter || refereeBonusFilter;

  // ─── Table Columns ───────────────────────────────────────────────────────────

  const tableColumns = [
    {
      key: 'referrer', label: 'Referrer', render: (row) => (
        <div className="flex items-center gap-2 min-w-[140px]">
          {row.referrer?.image ? (
            <img src={row.referrer.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0">
              <User size={14} />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap truncate">{fullName(row.referrer)}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">@{row.referrer_username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'referred', label: 'Referred User', render: (row) => (
        <div className="flex items-center gap-2 min-w-[140px]">
          {row.referred?.image ? (
            <img src={row.referred.image} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shrink-0">
              <User size={14} />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm whitespace-nowrap truncate">{fullName(row.referred)}</div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">@{row.referred_username}</div>
          </div>
        </div>
      ),
    },
    { key: 'offer', label: 'Offer', render: (row) => <span className="text-xs whitespace-nowrap text-gray-600 dark:text-gray-300 max-w-[140px] truncate block">{row.offer_name_snapshot || 'N/A'}</span> },
    {
      key: 'referrer_bonus', label: 'Referrer Bonus', render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs whitespace-nowrap text-gray-700 dark:text-gray-200 font-medium">{row.referrer_bonus_amount} ({row.referrer_bonus_type})</span>
          <BonusStatusBadge status={row.referrer_bonus_status} />
        </div>
      ),
    },
    {
      key: 'referee_bonus', label: 'Referee Bonus', render: (row) => (
        <div className="flex flex-col gap-1">
          <span className="text-xs whitespace-nowrap text-gray-700 dark:text-gray-200 font-medium">{row.referee_bonus_amount} ({row.referee_bonus_type})</span>
          <BonusStatusBadge status={row.referee_bonus_status} />
        </div>
      ),
    },
    { key: 'referred_date', label: 'Referred Date', render: (row) => <span className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDate(row.referred_date)}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  ];

  return (
    <ManagementHub
      title="Referrals Management"
      description="Track referral relationships, bonus payouts, and statuses."
      accent="indigo"
      onRefresh={handleRefresh}
      refreshing={refreshing}
      actions={
        <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-indigo-600 hover:bg-indigo-700">
          <Plus size={16} /> <span className='hidden md:block'>Add Referral</span>
        </Button>
      }
    >
      <div className="space-y-3 mt-2">
        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
        >
          {/* Top row: search + dropdowns */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Search by username, referral code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 h-[42px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm dark:text-gray-100"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Right controls */}
            <div className="flex items-start md:items-center lg:items-center flex-col md:flex-row lg:flex-row gap-2">
              {/* Status filter */}
              <div className="min-w-[160px] w-full md:w-auto">
                <SelectField
                  value={STATUS_OPTIONS.find((option) => option.value === statusFilter) || null}
                  onChange={(selected) => setStatusFilter(selected?.value || '')}
                  options={STATUS_OPTIONS}
                  placeholder="All Status"
                  isClearable
                  styles={filterSelectStyles}
                />
              </div>

              {/* Referrer bonus filter */}
              <div className="min-w-[190px] w-full md:w-auto">
                <SelectField
                  value={BONUS_STATUS_OPTIONS.find((option) => option.value === referrerBonusFilter) || null}
                  onChange={(selected) => setReferrerBonusFilter(selected?.value || '')}
                  options={BONUS_STATUS_OPTIONS}
                  placeholder="Referrer Bonus"
                  isClearable
                  styles={filterSelectStyles}
                />
              </div>

              {/* Referee bonus filter */}
              <div className="min-w-[190px] w-full md:w-auto">
                <SelectField
                  value={BONUS_STATUS_OPTIONS.find((option) => option.value === refereeBonusFilter) || null}
                  onChange={(selected) => setRefereeBonusFilter(selected?.value || '')}
                  options={BONUS_STATUS_OPTIONS}
                  placeholder="Referee Bonus"
                  isClearable
                  styles={filterSelectStyles}
                />
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              {/* Count */}
              <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap hidden xl:block">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{totalReferrals}</span> referrals
              </p>
            </div>
          </div>

          {/* Active filter pills */}
          <ActiveFilters
            searchTerm={debouncedSearch}
            statusFilter={statusFilter}
            referrerBonusFilter={referrerBonusFilter}
            refereeBonusFilter={refereeBonusFilter}
            onClearSearch={() => setSearchTerm('')}
            onClearStatus={() => setStatusFilter('')}
            onClearReferrerBonus={() => setReferrerBonusFilter('')}
            onClearRefereeBonus={() => setRefereeBonusFilter('')}
            onClearAll={clearAllFilters}
          />
        </motion.div>

        {/* Loading */}
        {loading && <PageContentSkeleton rows={6} columns={7} />}

        {/* Empty state */}
        {!loading && referrals.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-gray-950/50">
            <Gift className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 dark:text-gray-400">No referrals found</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">
              {hasActiveFilters ? 'Try adjusting your filters' : 'No referrals available'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                Clear all filters
              </button>
            )}
          </motion.div>
        )}

        {/* Content */}
        {!loading && referrals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50">
            <ManagementTable
              columns={tableColumns}
              rows={referrals}
              rowKey="referral_id"
              onRowClick={(row) => handleView(row)}
              getActions={(row) => [
                { label: 'View Details', icon: <Eye size={12} />, onClick: () => handleView(row), className: 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 dark:text-green-400 dark:hover:text-green-300' },
                { label: 'Edit Referral', icon: <Edit size={12} />, onClick: () => handleEdit(row), className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:hover:text-blue-300' },
                { label: 'Update Status', icon: <RefreshCcw size={12} />, onClick: () => setStatusReferral(row), className: 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-indigo-400 dark:hover:text-indigo-300' },
                { label: 'Delete', icon: <Trash2 size={12} />, onClick: () => setDeletingReferral(row), className: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400 dark:hover:text-red-300' },
              ]}
              accent="indigo"
            />
          </motion.div>
        )}

        {!loading && totalReferrals > 0 && (
          <PaginationComponent
            currentPage={currentPage}
            totalItems={totalReferrals}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onLimitChange={handleLimitChange}
            availableLimits={[10, 20, 50, 100]}
          />
        )}
      </div>

      {/* View Modal */}
      <AnimatePresence>
        {isViewModalOpen && selectedReferral && (
          <ViewReferralModal
            referral={selectedReferral}
            onClose={() => { setIsViewModalOpen(false); setSelectedReferral(null); }}
            onEdit={handleEdit}
          />
        )}
      </AnimatePresence>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isFormModalOpen && (
          <ReferralFormModal
            referral={editingReferral}
            onClose={() => setIsFormModalOpen(false)}
            onSubmit={handleFormSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Update Status Modal */}
      <AnimatePresence>
        {statusReferral && (
          <UpdateStatusModal
            referral={statusReferral}
            onClose={() => setStatusReferral(null)}
            onSubmit={handleStatusSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deletingReferral && (
          <DeleteConfirmModal
            referral={deletingReferral}
            onClose={() => setDeletingReferral(null)}
            onConfirm={handleDeleteConfirm}
            isSubmitting={isSubmitting}
          />
        )}
      </AnimatePresence>
    </ManagementHub>
  );
}
