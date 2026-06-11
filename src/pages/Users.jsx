import React, { useState } from 'react';
import { Search, Plus, Filter, Download } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementTable from '../components/common/ManagementTable';
import PaginationComponent from '../components/common/PaginationComponent';
import Button from '../components/common/Button';

// Dummy Data
const dummyUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', ssn: '***-**-1234', year: '2023', status: 'Filed', lastActivity: '2024-02-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', ssn: '***-**-5678', year: '2023', status: 'Pending', lastActivity: '2024-03-01' },
  { id: 3, name: 'Acme Corp', email: 'tax@acmecorp.com', ssn: 'XX-XXX4321', year: '2023', status: 'Overdue', lastActivity: '2023-11-20' },
  { id: 4, name: 'Alice Johnson', email: 'alice.j@example.com', ssn: '***-**-9876', year: '2023', status: 'Filed', lastActivity: '2024-01-10' },
  { id: 5, name: 'Bob Brown', email: 'bbrown@example.com', ssn: '***-**-5555', year: '2023', status: 'Pending', lastActivity: '2024-03-10' },
];

export default function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalItems = 45; // Simulated total

  const columns = [
    { key: 'name', label: 'Client Name', render: (row) => (
      <div>
        <div className="font-semibold text-gray-800">{row.name}</div>
        <div className="text-xs text-gray-500">{row.email}</div>
      </div>
    )},
    { key: 'ssn', label: 'Tax ID' },
    { key: 'year', label: 'Filing Year' },
    { key: 'status', label: 'Status', render: (row) => {
      const colors = {
        Filed: 'bg-green-100 text-green-800',
        Pending: 'bg-amber-100 text-amber-800',
        Overdue: 'bg-red-100 text-red-800'
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[row.status]}`}>
          {row.status}
        </span>
      );
    }},
    { key: 'lastActivity', label: 'Last Activity' },
  ];

  const actions = [
    { id: 'view', label: 'View Details' },
    { id: 'edit', label: 'Edit Profile' },
    { id: 'reminder', label: 'Send Reminder', danger: false },
  ];

  return (
    <ManagementHub
      title="Client Management"
      description="Manage taxpayers, corporate clients, and track their tax filing statuses."
      accent="blue"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 text-sm py-1.5">
            <Filter size={16} /> Filter
          </Button>
          <Button variant="outline" className="flex items-center gap-2 text-sm py-1.5">
            <Download size={16} /> Export
          </Button>
          <Button variant="primary" className="flex items-center gap-2 text-sm py-1.5">
            <Plus size={16} /> Add Client
          </Button>
        </div>
      }
    >
      <div className="mt-4 flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 w-full max-w-md shadow-sm mb-4">
        <Search className="text-gray-400 w-5 h-5 mr-2" />
        <input 
          type="text" 
          placeholder="Search clients by name, email, or Tax ID..." 
          className="bg-transparent border-none outline-none w-full text-sm text-gray-700"
        />
      </div>

      <ManagementTable
        columns={columns}
        rows={dummyUsers}
        rowKey="id"
        actions={actions}
        accent="blue"
      />

      <div className="mt-4">
        <PaginationComponent
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </ManagementHub>
  );
}
