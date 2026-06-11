import React from 'react';
import { Briefcase, Plus, FileText, CheckCircle, XCircle } from 'lucide-react';
import ManagementHub from '../components/common/ManagementHub';
import ManagementCard from '../components/common/ManagementCard';
import Button from '../components/common/Button';

// Dummy Data
const dummyServices = [
  { id: 1, name: 'Personal Tax Filing', description: 'Standard 1040 preparation and electronic filing.', rate: '$150', clients: 120, status: 'Active' },
  { id: 2, name: 'Corporate Tax Return', description: 'Form 1120/1120S for C-Corps and S-Corps.', rate: '$800', clients: 45, status: 'Active' },
  { id: 3, name: 'Audit Defense', description: 'Representation and support during IRS audits.', rate: '$250/hr', clients: 8, status: 'Active' },
  { id: 4, name: 'Bookkeeping', description: 'Monthly reconciliation and financial reporting.', rate: '$300/mo', clients: 60, status: 'Inactive' },
  { id: 5, name: 'Tax Consultation', description: '1-on-1 strategy sessions for tax planning.', rate: '$100/hr', clients: 32, status: 'Active' },
];

export default function Services() {
  return (
    <ManagementHub
      title="Tax Services"
      description="Manage the services and packages offered to your clients."
      accent="emerald"
      actions={
        <Button variant="primary" className="flex items-center gap-2 text-sm py-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Plus size={16} /> Add Service
        </Button>
      }
    >
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dummyServices.map((service, index) => (
          <ManagementCard
            key={service.id}
            title={service.name}
            subtitle={service.rate}
            icon={<Briefcase className="w-4 h-4" />}
            accent="emerald"
            delay={index * 0.1}
            badge={
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                service.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {service.status}
              </span>
            }
            actions={[
              { id: 'edit', label: 'Edit Service' },
              { id: 'toggle', label: service.status === 'Active' ? 'Deactivate' : 'Activate' },
            ]}
          >
            <div className="py-2">
              <p className="text-sm text-gray-600">{service.description}</p>
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <FileText className="w-3.5 h-3.5" />
                <span>{service.clients} Active Clients</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                 {service.status === 'Active' ? (
                   <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                 ) : (
                   <XCircle className="w-3.5 h-3.5 text-gray-400" />
                 )}
              </div>
            </div>
          </ManagementCard>
        ))}
      </div>
    </ManagementHub>
  );
}
