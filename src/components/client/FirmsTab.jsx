// components/client/FirmsTab.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Building2, FileText, Search, Calendar, Eye } from 'lucide-react';
import apiCall from '../../utils/apiCall';
import { formatDate } from '../../utils/helpers';
import { PageContentSkeleton } from '../../components/SkeletonComponent';
import ManagementTable from '../../components/common/ManagementTable';
import ManagementGrid from '../../components/common/ManagementGrid';
import ManagementCard from '../../components/common/ManagementCard';
import ManagementViewSwitcher from '../../components/common/ManagementViewSwitcher';
import Modal from '../../components/common/Modal';

const EmptyValue = () => <span className="text-gray-400 dark:text-gray-500">-</span>;

const InfoItem = ({ label, value, mono = false }) => (
  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    <p className={`mt-1 text-sm font-medium text-gray-800 dark:text-gray-100 break-words ${mono ? 'font-mono' : ''}`}>
      {value || <EmptyValue />}
    </p>
  </div>
);

export default function FirmsTab({ username, refreshTrigger }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(null);

  const activeFetchRef = useRef(null);

  useEffect(() => {
    fetchFirms();
  }, [username, refreshTrigger]);

  const fetchFirms = async () => {
    const requestKey = `firms|${refreshTrigger || 0}`;
    if (activeFetchRef.current === requestKey) return;
    activeFetchRef.current = requestKey;

    setLoading(true);
    try {
      const res = await apiCall(`/api/admin/clients/profile/${username}?resource=firms`, 'GET');
      const data = await res.json();
      if (data.success) {
        setFirms(data.data.firms || []);
      }
    } catch (error) {
      console.error('Failed to fetch firms:', error);
    } finally {
      setLoading(false);
      if (activeFetchRef.current === requestKey) activeFetchRef.current = null;
    }
  };

  const handleViewFirm = (firm) => {
    setSelectedFirm(firm);
    setDetailModalOpen(true);
  };

  const handleViewDocuments = (firm) => {
    navigate('/documents', {
      state: {
        documents: firm.documents || [],
        title: `Documents - ${firm.name || firm.firm_id}`,
        subtitle: `Firm ${firm.firm_id || ''} · Client ${username}`,
      },
    });
  };

  const getActions = (row) => [
    {
      label: 'View Details',
      icon: <Eye size={12} />,
      onClick: () => handleViewFirm(row),
      className: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:text-emerald-200 dark:hover:bg-emerald-950/40',
    },
    {
      label: 'Documents',
      icon: <FileText size={12} />,
      onClick: () => handleViewDocuments(row),
      className: 'text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-300 dark:hover:text-blue-200 dark:hover:bg-blue-950/40',
    }
  ];

  if (loading) return <PageContentSkeleton viewMode={viewMode} rows={3} columns={4} />;

  const columns = [
    {
      key: 'firm_id',
      label: 'Firm ID',
      render: (row) => <span className="font-mono text-xs">{row.firm_id}</span>
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => <span className="font-medium">{row.name}</span>
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => <span className="capitalize">{row.type}</span>
    },
    {
      key: 'pan_no',
      label: 'PAN',
      render: (row) => row.pan_no || <EmptyValue />
    },
    {
      key: 'gst_no',
      label: 'GST',
      render: (row) => row.gst_no || <EmptyValue />
    },
    {
      key: 'vat_no',
      label: 'VAT',
      render: (row) => row.vat_no || <EmptyValue />
    },
    {
      key: 'tan_no',
      label: 'TAN',
      render: (row) => row.tan_no || <EmptyValue />
    },
    {
      key: 'documents',
      label: 'Documents',
      render: (row) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleViewDocuments(row);
          }}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
        >
          <FileText size={14} /> Documents
        </button>
      )
    },
    {
      key: 'create_date',
      label: 'Created',
      render: (row) => formatDate(row.create_date)
    }
  ];

  const filteredFirms = firms.filter((firm) => {
    const search = searchTerm.toLowerCase();
    return (
      firm.name?.toLowerCase().includes(search) ||
      firm.firm_id?.toLowerCase().includes(search) ||
      firm.type?.toLowerCase().includes(search)
    );
  });

  const FirmCard = ({ firm }) => (
    <ManagementCard
      delay={0}
      accent="emerald"
      eyebrow={`Firm: ${firm.firm_id}`}
      title={firm.name}
      subtitle={firm.type || 'Unknown type'}
      icon={<Building2 size={18} />}
      badge={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
          <FileText size={10} /> {firm.documents?.length || 0}
        </span>
      }
      onClick={() => handleViewFirm(firm)}
      hoverable
      menuId={`firm-card-${firm.firm_id}`}
      actions={getActions(firm)}
      footer={
        <div className="flex items-center justify-between w-full text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar size={10} className="text-emerald-400" /> {formatDate(firm.create_date)}
          </span>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
        <span className="truncate">PAN: {firm.pan_no || '-'}</span>
        <span className="truncate">GST: {firm.gst_no || '-'}</span>
      </div>
    </ManagementCard>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search firms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="w-auto">
          <ManagementViewSwitcher viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {filteredFirms.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Building2 className="text-gray-300 dark:text-gray-600 mx-auto mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No firms registered</p>
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <ManagementTable
                columns={columns}
                rows={filteredFirms}
                rowKey="firm_id"
                accent="emerald"
                getActions={getActions}
                onRowClick={(row) => handleViewFirm(row)}
              />
            </div>
          ) : (
            <ManagementGrid viewMode={viewMode} className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <AnimatePresence>
                {filteredFirms.map((firm) => (
                  <FirmCard key={firm.firm_id} firm={firm} />
                ))}
              </AnimatePresence>
            </ManagementGrid>
          )}
        </>
      )}

      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedFirm(null);
        }}
        title="Firm Details"
        icon={Building2}
        size="xl"
      >
        {selectedFirm && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
                  <Building2 size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{selectedFirm.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{selectedFirm.type || 'Unknown type'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  handleViewDocuments(selectedFirm);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
              >
                <FileText size={15} /> Documents
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem label="Firm ID" value={selectedFirm.firm_id} mono />
              <InfoItem label="Created" value={formatDate(selectedFirm.create_date)} />
              <InfoItem label="PAN Number" value={selectedFirm.pan_no} />
              <InfoItem label="GST Number" value={selectedFirm.gst_no} />
              <InfoItem label="VAT Number" value={selectedFirm.vat_no} />
              <InfoItem label="TAN Number" value={selectedFirm.tan_no} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
