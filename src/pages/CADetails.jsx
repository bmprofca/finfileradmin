import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  ChevronLeft,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  LogOut,
  Edit,
  CheckCircle,
  XCircle,
  ShieldAlert,
  DollarSign
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import RefreshButton from "../components/common/RefreshButton";
import { PageContentSkeleton } from "../components/SkeletonComponent";
import Modal from "../components/common/Modal";
import apiCall, { uploadFile } from "../utils/apiCall";
import CAServiceFees from "./CAServiceFees";

const CAStatusBadge = ({ status }) => {
  const isActive = status === 1 || status === true || status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isActive
          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
          : "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {isActive ? <CheckCircle size={10} /> : <XCircle size={10} />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600">
      <Icon size={18} className="text-violet-600 dark:text-violet-400" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
        {value || "N/A"}
      </div>
    </div>
  </div>
);

const CAEditModal = ({ ca, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    first_name: ca?.first_name || "",
    last_name: ca?.last_name || "",
    email: ca?.email || "",
    mobile: ca?.mobile || "",
    image: ca?.image || "",
    status: ca?.status ?? true,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setStatus = (val) => setForm((f) => ({ ...f, status: val }));

  const uploadImageFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      setForm((f) => ({ ...f, image: url }));
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    uploadImageFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await apiCall(`/api/admin/cas/update/${ca.username}`, "PUT", form);
      const json = await response.json();
      if (json.success) {
        toast.success("CA updated successfully");
        onSuccess();
      } else {
        toast.error(json.message || "Failed to update CA");
      }
    } catch {
      toast.error("Error connecting to server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all text-sm dark:text-gray-100";

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit CA Profile"
      icon={Edit}
      size="2xl"
      contentClassName="p-5"
      closeText="Cancel"
      footer={
        <button
          type="submit"
          form="ca-edit-form"
          disabled={isSubmitting || isUploading}
          className="px-5 py-2.5 rounded-lg bg-violet-600 dark:bg-violet-500 text-white text-sm font-semibold hover:bg-violet-700 dark:hover:bg-violet-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
      }
    >
      <form id="ca-edit-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Account Status</h4>
          <div className="flex gap-3 max-w-sm">
            {[{ label: "Active", value: true }, { label: "Inactive", value: false }].map(({ label, value }) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setStatus(value)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  form.status === value
                    ? value === true
                      ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-600 dark:text-emerald-300 shadow-sm"
                      : "bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-200 shadow-sm"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>

        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Personal Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">First Name *</label>
              <input required value={form.first_name} onChange={set("first_name")} placeholder="First name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Last Name *</label>
              <input required value={form.last_name} onChange={set("last_name")} placeholder="Last name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Email *</label>
              <input required type="email" value={form.email} onChange={set("email")} placeholder="Email" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Mobile *</label>
              <input required value={form.mobile} onChange={set("mobile")} placeholder="Mobile" className={inputCls} />
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-gray-200 dark:bg-gray-700"></div>

        <div>
          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Profile Image</h4>
          <label
            htmlFor="ca-image-upload"
            className={`mt-2 flex cursor-pointer justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 px-6 py-8 bg-gray-50 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-within:ring-4 focus-within:ring-violet-500/10 ${
              isUploading ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <div className="text-center flex flex-col items-center">
              {form.image && !isUploading ? (
                <div className="mb-4">
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg mx-auto"
                  />
                </div>
              ) : (
                <div className="mx-auto h-16 w-16 mb-4 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                  <User size={32} className="text-violet-600 dark:text-violet-400" />
                </div>
              )}
              <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                <span className="font-semibold text-violet-600 dark:text-violet-400">
                  {isUploading ? "Uploading image..." : form.image ? "Change profile image" : "Upload a profile image"}
                </span>
                <input
                  id="ca-image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>
            </div>
          </label>
        </div>
      </form>
    </Modal>
  );
};

export default function CADetails() {
  const { username } = useParams();
  const navigate = useNavigate();
  const [ca, setCa] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchCaDetails = async () => {
    setLoading(true);
    try {
      const response = await apiCall(`/api/admin/cas/${username}`, "GET");
      const data = await response.json();
      if (data.success) {
        setCa(data.data.ca);
      } else {
        toast.error(data.message || "Failed to fetch CA details");
        navigate("/cas");
      }
    } catch {
      toast.error("Error connecting to server");
      navigate("/cas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCaDetails();
  }, [username]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCaDetails();
  };

  const handleLogoutSessions = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogoutSessions = async () => {
    setIsLoggingOut(true);
    try {
      const response = await apiCall(`/api/admin/cas/logout/${username}`, "POST");
      const data = await response.json();
      if (data.success) {
        toast.success("All sessions logged out successfully");
        setIsLogoutModalOpen(false);
      } else {
        toast.error(data.message || "Failed to log out sessions");
      }
    } catch {
      toast.error("Error connecting to server");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-[1600px] p-4">
          <PageContentSkeleton rows={4} columns={2} />
        </div>
      </div>
    );
  }

  if (!ca) return null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1600px]">
        {/* Unified Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-2 mt-2">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
            {/* Avatar & Details */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative shrink-0">
                {ca.image ? (
                  <img
                    src={ca.image}
                    alt={ca.full_name}
                    className="w-20 h-20 rounded-lg object-cover shadow-sm border-4 border-white dark:border-gray-800"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-sm border-4 border-white dark:border-gray-800 text-white">
                    <User size={32} />
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2">
                  <CAStatusBadge status={ca.status} />
                </div>
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {ca.full_name}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-mono text-xs mb-2">
                  @{ca.username}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                    <Briefcase size={12} /> {ca.profession || "Chartered Accountant"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                    Orders: {ca.pending_orders || 0} Pending / {ca.completed_orders || 0} Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <RefreshButton
                onClick={handleRefresh}
                loading={refreshing}
                title="Refresh CA details"
                className="h-9 text-xs"
              >
                <span className="hidden sm:inline">Refresh</span>
              </RefreshButton>
              <Button
                variant="outline"
                onClick={() => navigate("/cas")}
                className="flex items-center gap-1.5 text-xs py-1.5 px-3 h-9"
              >
                <ChevronLeft size={14} /> <span className="hidden sm:inline">Back</span>
              </Button>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="primary"
                className="flex items-center gap-1.5 text-xs py-1.5 px-3 h-9 bg-violet-600 hover:bg-violet-700"
              >
                <Edit size={14} /> <span className="hidden sm:inline">Edit CA</span>
              </Button>
              <Button
                onClick={handleLogoutSessions}
                disabled={isLoggingOut}
                variant="outline"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 h-9 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-semibold border-red-200 dark:border-red-800/50"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">{isLoggingOut ? "Logging out..." : "Logout Sessions"}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3 mx-auto">

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mt-6 mb-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("service_fees")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "service_fees"
                ? "border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Service Fees
          </button>
        </div>

        {activeTab === "overview" ? (
          /* Info Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoItem icon={Mail} label="Email Address" value={ca.email} />
            <InfoItem icon={Phone} label="Mobile Number" value={ca.mobile} />
            <InfoItem icon={Calendar} label="Date of Birth" value={ca.date_of_birth} />

            <div className="lg:col-span-3">
              <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin size={18} className="text-violet-600 dark:text-violet-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Address Information</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address Line 1</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{ca.address_line_1 || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address Line 2</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{ca.address_line_2 || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">District</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">{ca.district || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">State & Pincode</div>
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {ca.state || "—"} {ca.pincode ? `- ${ca.pincode}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CAServiceFees />
        )}
      </div>

      <AnimatePresence>
        {isEditModalOpen && (
          <CAEditModal
            ca={ca}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={() => {
              setIsEditModalOpen(false);
              fetchCaDetails();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLogoutModalOpen && (
          <Modal
            isOpen={true}
            onClose={() => !isLoggingOut && setIsLogoutModalOpen(false)}
            title="Logout All Sessions"
            icon={LogOut}
            size="md"
            closeText="Cancel"
            footer={
              <button
                disabled={isLoggingOut}
                onClick={confirmLogoutSessions}
                className="px-5 py-2.5 rounded-lg bg-amber-600 dark:bg-amber-500 text-white text-sm font-semibold hover:bg-amber-700 dark:hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoggingOut ? "Logging out..." : "Yes, Logout"}
              </button>
            }
          >
            <div className="text-gray-600 dark:text-gray-400">
              Are you sure you want to log out all sessions for this CA? They will have to log in again.
            </div>
          </Modal>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}