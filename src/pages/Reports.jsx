import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, FileText, Download } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementCard from '../components/common/ManagementCard';
import ManagementTable from '../components/common/ManagementTable';
import Button from '../components/common/Button';

// Dummy Data
const summaryMetrics = [
  { id: 1, title: 'Total Revenue', value: '$124,500', trend: '+14% from last month', icon: <DollarSign className="w-5 h-5 text-indigo-600" /> },
  { id: 2, title: 'Filings Processed', value: '842', trend: '+22% from last month', icon: <FileText className="w-5 h-5 text-indigo-600" /> },
  { id: 3, title: 'Active Clients', value: '1,204', trend: '+5% from last month', icon: <TrendingUp className="w-5 h-5 text-indigo-600" /> },
];

const recentFilings = [
  { id: 101, client: 'John Doe', type: '1040 Personal', amount: '$150.00', date: '2024-03-12', status: 'Completed' },
  { id: 102, client: 'Acme Corp', type: '1120 Corporate', amount: '$800.00', date: '2024-03-11', status: 'Completed' },
  { id: 103, client: 'Jane Smith', type: 'Tax Consultation', amount: '$100.00', date: '2024-03-10', status: 'Pending' },
  { id: 104, client: 'Global LLC', type: 'Bookkeeping (Feb)', amount: '$300.00', date: '2024-03-09', status: 'Overdue' },
];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue' },
    { id: 'filings', label: 'Filing Stats' },
  ];

  const columns = [
    { key: 'client', label: 'Client Name', className: 'font-medium text-gray-900' },
    { key: 'type', label: 'Service Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: (row) => {
      const colors = {
        Completed: 'text-green-600 bg-green-50',
        Pending: 'text-amber-600 bg-amber-50',
        Overdue: 'text-red-600 bg-red-50'
      };
      return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[row.status]}`}>
          {row.status}
        </span>
      );
    }},
  ];

  return (
    <ManagementHub
      title="Financial Reports & Analytics"
      description="Track revenue, monitor filing progress, and export data."
      accent="indigo"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      actions={
        <Button variant="outline" className="flex items-center gap-2 text-sm py-1.5">
          <Download size={16} /> Export CSV
        </Button>
      }
    >
      <div className="mt-6">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {summaryMetrics.map((metric, index) => (
            <ManagementCard
              key={metric.id}
              accent="indigo"
              delay={index * 0.1}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{metric.value}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center">
                  {metric.icon}
                </div>
              </div>
              <div className="mt-4 text-xs text-indigo-600 font-medium">
                {metric.trend}
              </div>
            </ManagementCard>
          ))}
        </div>

        {/* Recent Transactions Table */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Recent Transactions</h3>
          <ManagementTable
            columns={columns}
            rows={recentFilings}
            rowKey="id"
            accent="indigo"
            actions={[{ id: 'view_invoice', label: 'View Invoice' }]}
          />
        </div>
      </div>
    </ManagementHub>
  );
}
