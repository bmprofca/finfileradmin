import React from "react";

const skeletonBlock = "bg-gray-200 dark:bg-gray-700";
const skeletonSoftBlock = "bg-gray-100 dark:bg-gray-800";

const AdminSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header Section */}
      <div className="mb-6">
        <div className={`h-8 w-48 ${skeletonBlock} rounded-lg mb-3`}></div>
        <div className={`h-4 w-64 sm:w-96 ${skeletonBlock} rounded-lg`}></div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex-1 mr-4">
            <div className={`h-10 w-full ${skeletonBlock} rounded-lg`}></div>
          </div>
          <div className={`h-10 w-32 ${skeletonBlock} rounded-lg`}></div>
        </div>
      </div>

      {/* Content Grid/Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`h-4 ${skeletonBlock} rounded`}></div>
            ))}
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="grid grid-cols-6 gap-4">
                <div className={`h-4 ${skeletonBlock} rounded col-span-2`}></div>
                <div className={`h-4 ${skeletonBlock} rounded`}></div>
                <div className={`h-4 ${skeletonBlock} rounded`}></div>
                <div className={`h-4 ${skeletonBlock} rounded`}></div>
                <div className={`h-8 ${skeletonBlock} rounded w-20`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between items-center">
        <div className={`h-4 w-32 ${skeletonBlock} rounded`}></div>
        <div className="flex gap-2">
          <div className={`h-9 w-9 ${skeletonBlock} rounded`}></div>
          <div className={`h-9 w-9 ${skeletonBlock} rounded`}></div>
          <div className={`h-9 w-9 ${skeletonBlock} rounded`}></div>
          <div className={`h-9 w-9 ${skeletonBlock} rounded`}></div>
        </div>
      </div>
    </div>
  );
};

export const GlobalSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900 animate-pulse">
      <div className="sticky top-0 z-40 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${skeletonBlock}`}></div>
            <div className={`h-5 w-36 rounded ${skeletonBlock}`}></div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden sm:block h-9 w-28 rounded-lg ${skeletonBlock}`}></div>
            <div className={`h-10 w-10 rounded-full ${skeletonBlock}`}></div>
          </div>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden md:block w-16 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-[calc(100vh-64px)] p-3">
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={`h-10 w-10 rounded-lg ${skeletonBlock}`}></div>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-4">
          <div className="w-full max-w-8xl p-2">
            <AdminSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
};

export const PageContentSkeleton = ({ viewMode = "table", rows = 6, columns = 6 }) => {
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-10 w-10 rounded-lg shrink-0 ${skeletonBlock}`}></div>
                <div className="space-y-2">
                  <div className={`h-4 w-32 rounded ${skeletonBlock}`}></div>
                  <div className={`h-3 w-24 rounded ${skeletonBlock}`}></div>
                </div>
              </div>
              <div className={`h-6 w-16 rounded-full ${skeletonBlock}`}></div>
            </div>
            <div className="space-y-2">
              <div className={`h-3 w-full rounded ${skeletonBlock}`}></div>
              <div className={`h-3 w-3/4 rounded ${skeletonBlock}`}></div>
              <div className={`h-3 w-1/2 rounded ${skeletonBlock}`}></div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between">
              <div className={`h-4 w-20 rounded ${skeletonBlock}`}></div>
              <div className={`h-4 w-16 rounded ${skeletonBlock}`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-950/50 overflow-hidden animate-pulse">
      <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 p-4">
        <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {[...Array(columns)].map((_, i) => (
            <div key={i} className={`h-4 rounded ${skeletonBlock}`}></div>
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={`${colIndex === columns - 1 ? "h-8" : "h-4"} rounded ${colIndex === 0 ? skeletonSoftBlock : skeletonBlock}`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Card View Skeleton
export const CardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
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
