import React from 'react';
import { motion } from 'framer-motion';
import RefreshButton from './RefreshButton';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

const accentStyles = {
  slate: 'from-slate-600 to-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  blue: 'from-blue-600 to-indigo-600 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  green: 'from-green-600 to-emerald-600 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  emerald: 'from-emerald-600 to-teal-600 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  indigo: 'from-indigo-600 to-violet-600 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  violet: 'from-violet-600 to-fuchsia-600 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  amber: 'from-amber-600 to-orange-600 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  rose: 'from-rose-600 to-red-600 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

const activeButtonStyles = {
  slate: 'bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 text-white shadow-md',
  blue: 'bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white shadow-md shadow-blue-300 dark:shadow-blue-900/50',
  green: 'bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white shadow-md shadow-green-300 dark:shadow-green-900/50',
  emerald: 'bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white shadow-md shadow-emerald-300 dark:shadow-emerald-900/50',
  indigo: 'bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white shadow-md shadow-indigo-300 dark:shadow-indigo-900/50',
  violet: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-500 dark:to-fuchsia-500 text-white shadow-md shadow-violet-300 dark:shadow-violet-900/50',
  amber: 'bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 text-white shadow-md shadow-amber-300 dark:shadow-amber-900/50',
  rose: 'bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-500 dark:to-red-500 text-white shadow-md shadow-rose-300 dark:shadow-rose-900/50',
};

export default function ManagementHub({
  eyebrow,
  title,
  description,
  accent = 'slate',
  summary,
  tabs,
  activeTab,
  onTabChange,
  onRefresh,
  refreshing = false,
  refreshLabel = 'Refresh',
  refreshTitle,
  actions,
  children,
  className = '',
  contentClassName = '',
  widthClassName = 'max-w-[1600px]',
}) {
  const accentClass = accentStyles[accent] || accentStyles.slate;

  return (
    <div className={joinClasses('min-h-screen', className)}>
      <div className={joinClasses('mx-auto', widthClassName)}>
        {(eyebrow || title || description || summary || actions || onRefresh || (tabs && tabs.length > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-4 rounded-sm border border-slate-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 p-2.5 shadow-sm shadow-slate-200/40 dark:shadow-none backdrop-blur md:p-3"
          >
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                {eyebrow && (
                  <div className={joinClasses(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em]',
                    accentClass
                  )}>
                    {eyebrow}
                  </div>
                )}
                {title && <h1 className="mt-1 text-lg font-bold flex-wrap whitespace-nowrap text-slate-900 dark:text-gray-100 md:text-xl">{title}</h1>}
                {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">{description}</p>}
              </div>

              {(summary || actions || onRefresh) && (
                <div className="flex flex-wrap items-center justify-between w-full gap-1.5">
                  {summary}
                  <div className="flex absolute top-[10px] right-[10px] w-full items-center justify-end gap-1.5">
                    {onRefresh && (
                      <RefreshButton
                        type="button"
                        loading={refreshing}
                        onClick={onRefresh}
                        title={refreshTitle || refreshLabel}
                      >
                        <span className='hidden md:block'>{refreshLabel}</span>
                      </RefreshButton>
                    )}
                    {actions}
                  </div>

                </div>
              )}
            </div>

            {tabs?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === activeTab;
                  const disabled = tab.disabled || false;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => !disabled && onTabChange && onTabChange(tab.id)}
                      disabled={disabled}
                      title={tab.title || tab.description || tab.label}
                      className={joinClasses(
                        'inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all duration-200',
                        isActive
                          ? activeButtonStyles[accent] || activeButtonStyles.slate
                          : disabled
                            ? 'cursor-not-allowed border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500'
                            : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:border-slate-300 dark:hover:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700'
                      )}
                    >
                      {Icon && <Icon size={13} />}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        <div className={`${contentClassName || ""}`}>{children}</div>
      </div>
    </div>
  );
}
