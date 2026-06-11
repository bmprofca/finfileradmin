import React from "react";

const AdminSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header Section */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded-lg mb-3"></div>
        <div className="h-4 w-64 sm:w-96 bg-gray-200 rounded-lg"></div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 mr-4">
            <div className="h-10 w-full bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>

      {/* Content Grid/Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-6 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gray-200 rounded"></div>
          <div className="h-9 w-9 bg-gray-200 rounded"></div>
          <div className="h-9 w-9 bg-gray-200 rounded"></div>
          <div className="h-9 w-9 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

// Card View Skeleton
export const CardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-gray-200 rounded"></div>
            <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
          </div>
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <div className="border-b border-gray-100 p-4 animate-pulse">
      <div className="grid grid-cols-5 gap-4">
        {[...Array(columns)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
};

// Form Skeleton
export const FormSkeleton = () => {
  return (
    <div className="space-y-3 animate-pulse">
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-10 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-24 w-full bg-gray-200 rounded-lg"></div>
      </div>
      <div className="flex justify-end gap-3">
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
};

// Modal Skeleton
export const ModalSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-6 w-48 bg-gray-200 rounded mb-6"></div>
      <div className="space-y-4">
        <div className="h-4 w-full bg-gray-200 rounded"></div>
        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
};

// Detail View Skeleton
export const DetailSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 w-48 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-gray-100 rounded-lg p-3">
            <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSkeleton;