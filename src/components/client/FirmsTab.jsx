// components/client/FirmsTab.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, FileText, Search, RefreshCw, Download } from 'lucide-react';
import apiCall from '../../utils/apiCall';
import { formatDate } from '../../utils/helpers';
import { PageContentSkeleton } from '../../components/SkeletonComponent';
import ManagementTable from '../../components/common/ManagementTable';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

export default function FirmsTab({ username }) {
  const [loading, setLoading] = useState(true);
  const [firms, setFirms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Document modal states
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [selectedFirmId, setSelectedFirmId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    fetchFirms();
  }, [username]);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const res = await apiCall(`/api/admin/profile/${username}?resource=firms`, 'GET');
      const data = await res.json();
      if (data.success) {
        setFirms(data.data.firms);
      }
    } catch (error) {
      console.error('Failed to fetch firms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFirmDocuments = async (firmId) => {
    setLoadingDocs(true);
    try {
      const res = await apiCall(
        `/api/admin/profile/${username}?resource=firm-documents&firm_id=${firmId}`,
        'GET'
      );
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleViewDocuments = (firmId) => {
    setSelectedFirmId(firmId);
    setDocModalOpen(true);
    fetchFirmDocuments(firmId);
  };

  const handleRefresh = () => {
    fetchFirms();
  };

  if (loading) return <PageContentSkeleton rows={3} columns={4} />;

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
      render: (row) => row.pan_no || '—'
    },
    {
      key: 'gst_no',
      label: 'GST',
      render: (row) => row.gst_no || '—'
    },
    {
      key: 'vat_no',
      label: 'VAT',
      render: (row) => row.vat_no || '—'
    },
    {
      key: 'tan_no',
      label: 'TAN',
      render: (row) => row.tan_no || '—'
    },
    {
      key: 'create_date',
      label: 'Created',
      render: (row) => formatDate(row.create_date)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleViewDocuments(row.firm_id)}
          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
        >
          <FileText size={14} /> Documents
        </button>
      )
    }
  ];

  // Filter firms based on search
  const filteredFirms = firms.filter(firm =>
    firm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    firm.firm_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    firm.type?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 text-sm py-2">
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {filteredFirms?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Building2 className="text-gray-300 dark:text-gray-600 mx-auto mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No firms registered</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ManagementTable columns={columns} rows={filteredFirms || []} rowKey="firm_id" accent="emerald" />
        </div>
      )}

      {/* Documents Modal */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title="Firm Documents"
        icon={FileText}
        size="lg"
      >
        {loadingDocs ? (
          <div className="py-8 text-center">
            <RefreshCw className="animate-spin mx-auto text-emerald-500" size={32} />
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="text-gray-300 dark:text-gray-600 mx-auto mb-3" size={48} />
            <p className="text-gray-500 dark:text-gray-400">No documents found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{doc.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {doc.file_name} • {(doc.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button className="p-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors">
                  <Download size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}