import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserRound,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] },
  }),
};

function getStoredUser() {
  try {
    const rawUser = localStorage.getItem("user_data");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getFullName(user) {
  return [user?.first_name, user?.middle_name, user?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatDate(value) {
  if (!value) return "Not available";

  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskToken(token) {
  if (!token) return "Not available";
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}...${token.slice(-8)}`;
}

function DetailItem({ icon: Icon, label, value, index }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-500/10">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-gray-950 dark:text-white">
            {value || "Not available"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const profile = useMemo(() => user || getStoredUser(), [user]);
  const fullName = getFullName(profile) || profile?.username || "User";
  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!profile) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
        Profile data is not available. Please sign in again.
      </div>
    );
  }

  const details = [
    { icon: User, label: "Username", value: profile.username },
    { icon: Phone, label: "Mobile", value: profile.mobile },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: ShieldCheck, label: "User Type", value: profile.user_type },
    { icon: CalendarClock, label: "Session Expiry", value: formatDate(profile.expire_date) },
    { icon: BadgeCheck, label: "Access Token", value: maskToken(profile.token) },
  ];

  return (
    <div className="space-y-6 text-gray-950 dark:text-white">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="h-24 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
        <div className="px-5 pb-6 sm:px-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-bold text-white shadow-lg dark:border-gray-900">
                {initials || <UserRound className="h-8 w-8" />}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold text-gray-950 dark:text-white">{fullName}</h1>
                <p className="mt-1 text-sm capitalize text-gray-500 dark:text-gray-400">
                  {profile.user_type || "User"}
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              {profile.status ? "Active Account" : "Inactive Account"}
            </div>
          </div>
        </div>
      </motion.div>

      <section>
        <motion.p
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400"
        >
          Account Details
        </motion.p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {details.map((item, index) => (
            <DetailItem key={item.label} {...item} index={index + 2} />
          ))}
        </div>
      </section>
    </div>
  );
}
