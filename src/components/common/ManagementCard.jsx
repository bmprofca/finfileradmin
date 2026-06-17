import React from 'react';
import { motion } from 'framer-motion';
import ActionMenu from './ActionMenu';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function ManagementCard({
  title,
  subtitle,
  eyebrow,
  icon,
  badge,
  headerAction,
  children,
  footer,
  actions,
  menuId,
  activeId,
  onToggle,
  onClick,
  className = '',
  bodyClassName = '',
  footerClassName = '',
  accent = 'slate',
  delay = 0,
  hoverable = true,
}) {
  const accentMap = {
    slate: 'border-slate-200 dark:border-gray-700 shadow-slate-100 dark:shadow-none',
    blue: 'border-blue-100 dark:border-blue-900/50 shadow-blue-100 dark:shadow-none',
    green: 'border-green-100 dark:border-green-900/50 shadow-green-100 dark:shadow-none',
    emerald: 'border-emerald-100 dark:border-emerald-900/50 shadow-emerald-100 dark:shadow-none',
    indigo: 'border-indigo-100 dark:border-indigo-900/50 shadow-indigo-100 dark:shadow-none',
    violet: 'border-violet-100 dark:border-violet-900/50 shadow-violet-100 dark:shadow-none',
    rose: 'border-rose-100 dark:border-rose-900/50 shadow-rose-100 dark:shadow-none',
    amber: 'border-amber-100 dark:border-amber-900/50 shadow-amber-100 dark:shadow-none',
  };

  const cardBody = (
    <div
      className={joinClasses(
        'rounded-lg border bg-white dark:bg-gray-800 p-2.5 shadow-sm transition-all duration-300',
        accentMap[accent] || accentMap.slate,
        hoverable && 'hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-gray-900/50',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(eyebrow || title || subtitle || badge || headerAction || actions) && (
        <div className="mb-2 flex items-start justify-between gap-1.5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-gray-500">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              {icon && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 dark:bg-gray-700 text-slate-600 dark:text-gray-300">{icon}</span>}
              <div className="min-w-0">
                {title && <h3 className="truncate text-[13px] font-bold text-slate-900 dark:text-gray-100">{title}</h3>}
                {subtitle && <p className="text-[11px] text-slate-500 dark:text-gray-400">{subtitle}</p>}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {badge}
            {headerAction}
            {actions && (
              <ActionMenu
                menuId={menuId || title || 'card'}
                activeId={activeId}
                onToggle={onToggle}
                actions={actions}
              />
            )}
          </div>
        </div>
      )}

      <div className={bodyClassName}>{children}</div>

      {footer && (
        <div className={joinClasses('mt-2 flex items-center justify-between gap-1.5 border-t border-slate-100 dark:border-gray-700 pt-2', footerClassName)}>
          {footer}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {cardBody}
    </motion.div>
  );
}
