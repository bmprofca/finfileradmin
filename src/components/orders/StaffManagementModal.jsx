import React, { useState, useEffect } from "react";
import { Search, X, Users, UserPlus, UserMinus, ChevronRight, ChevronLeft, Phone, RefreshCw } from "lucide-react";
import Modal from "../common/Modal";

const UserCheck = ({ size, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

const StaffCardSkeleton = () => (
  <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
      <div>
        <div className="h-3.5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1.5" />
        <div className="h-3 w-20 bg-gray-100 dark:bg-gray-700/50 rounded" />
      </div>
    </div>
    <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg" />
  </div>
);

const StaffManagementModal = ({
  order,
  allStaff,
  staffLoading,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [leftStaff, setLeftStaff] = useState([]);
  const [rightStaff, setRightStaff] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialRightStaff, setInitialRightStaff] = useState([]);
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");

  useEffect(() => {
    if (order && allStaff.length > 0) {
      const assignedUsernames =
        order.assigned_staff?.map((s) => s.username) || [];
      const left = allStaff.filter(
        (s) => !assignedUsernames.includes(s.username),
      );
      const right = allStaff.filter((s) =>
        assignedUsernames.includes(s.username),
      );
      setLeftStaff(left);
      setRightStaff(right);
      setInitialRightStaff(right.map((s) => s.username));
      setHasChanges(false);
    }
  }, [order, allStaff]);

  const filterStaff = (list, search) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (s) =>
        (s.full_name || s.name || "").toLowerCase().includes(q) ||
        (s.mobile || "").includes(q) ||
        (s.username || "").toLowerCase().includes(q),
    );
  };

  const moveToRight = (staff) => {
    setLeftStaff((prev) => prev.filter((s) => s.username !== staff.username));
    setRightStaff((prev) => [...prev, staff]);
    setHasChanges(true);
  };

  const moveToLeft = (staff) => {
    setRightStaff((prev) => prev.filter((s) => s.username !== staff.username));
    setLeftStaff((prev) => [...prev, staff]);
    setHasChanges(true);
  };

  const moveAllToRight = () => {
    setRightStaff((prev) => [...prev, ...leftStaff]);
    setLeftStaff([]);
    setHasChanges(true);
  };

  const moveAllToLeft = () => {
    setLeftStaff((prev) => [...prev, ...rightStaff]);
    setRightStaff([]);
    setHasChanges(true);
  };

  const handleSubmit = () => {
    onSubmit({
      order_id: order.order_id,
      staff_usernames: rightStaff.map((s) => s.username),
    });
  };

  const isInitial = () => {
    const currentRight = [...rightStaff.map((s) => s.username)].sort();
    const initialRight = [...initialRightStaff].sort();
    return JSON.stringify(currentRight) === JSON.stringify(initialRight);
  };

  const filteredLeft = filterStaff(leftStaff, leftSearch);
  const filteredRight = filterStaff(rightStaff, rightSearch);

  const StaffCard = ({
    staff,
    onAction,
    actionIcon: ActionIcon,
    actionLabel,
  }) => (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        {staff.image ? (
          <img
            src={staff.image}
            alt={staff.full_name || staff.name}
            className="w-8 h-8 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(staff.full_name || staff.name || "?").charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {staff.full_name || staff.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
            <Phone size={10} /> {staff.mobile || "—"}
          </p>
        </div>
      </div>
      <button
        onClick={() => onAction(staff)}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100"
        title={actionLabel}
      >
        <ActionIcon size={16} className="text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );

  const SearchInput = ({ value, onChange, placeholder }) => (
    <div className="relative mb-2">
      <Search
        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        size={13}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-gray-100"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Manage Staff · ${order?.order_name || ""}`}
      icon={Users}
      size="3xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {rightStaff.length} staff assigned
          </span>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !hasChanges || isInitial()}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users size={14} />
            {isSubmitting ? "Updating..." : "Update Staff"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Use the arrow buttons to move staff between available and assigned
          lists.
        </p>

        <div className="flex flex-col gap-4 lg:flex-row md:flex-row items-stretch">
          {/* Left Column - Available Staff */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserPlus size={14} className="text-indigo-500" />
                Available ({leftStaff.length})
              </h4>
              {leftStaff.length > 0 && (
                <button
                  onClick={moveAllToRight}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  <ChevronRight size={14} /> All
                </button>
              )}
            </div>
            <SearchInput
              value={leftSearch}
              onChange={setLeftSearch}
              placeholder="Search available..."
            />
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {staffLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <StaffCardSkeleton key={i} />
                ))
              ) : filteredLeft.length > 0 ? (
                filteredLeft.map((staff) => (
                  <StaffCard
                    key={staff.username}
                    staff={staff}
                    onAction={moveToRight}
                    actionIcon={ChevronRight}
                    actionLabel="Assign"
                  />
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  <UserPlus
                    className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                    size={32}
                  />
                  {leftSearch ? "No matching staff" : "No available staff"}
                </div>
              )}
            </div>
          </div>

          {/* Center Column */}
          <div className="w-16 mx-auto flex flex-col items-center justify-center gap-4 py-4 flex-shrink-0">
            <button
              onClick={moveAllToRight}
              disabled={leftStaff.length === 0}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"
            >
              <ChevronRight size={20} />
            </button>
            <button
              onClick={moveAllToLeft}
              disabled={rightStaff.length === 0}
              className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-indigo-200 dark:border-indigo-700"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-xs text-gray-400 font-medium text-center">
              {rightStaff.length} / {allStaff.length}
            </div>
          </div>

          {/* Right Column - Assigned Staff */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <UserCheck size={14} className="text-green-500" />
                Assigned ({rightStaff.length})
              </h4>
              {rightStaff.length > 0 && (
                <button
                  onClick={moveAllToLeft}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> All
                </button>
              )}
            </div>
            <SearchInput
              value={rightSearch}
              onChange={setRightSearch}
              placeholder="Search assigned..."
            />
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {staffLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <StaffCardSkeleton key={i} />
                ))
              ) : filteredRight.length > 0 ? (
                filteredRight.map((staff) => (
                  <StaffCard
                    key={staff.username}
                    staff={staff}
                    onAction={moveToLeft}
                    actionIcon={ChevronLeft}
                    actionLabel="Unassign"
                  />
                ))
              ) : (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  <UserMinus
                    className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                    size={32}
                  />
                  {rightSearch ? "No matching staff" : "No staff assigned"}
                </div>
              )}
            </div>
          </div>
        </div>

        {hasChanges && !isInitial() && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <RefreshCw
              size={14}
              className="text-amber-600 dark:text-amber-400 animate-spin-slow"
            />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              You have unsaved changes. Click "Update Staff" to save.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default StaffManagementModal;
