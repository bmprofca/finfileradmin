import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../utils/apiCall';

// ─── Context ──────────────────────────────────────────────────────────────────

const PermissionsContext = createContext(null);

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * PermissionsProvider
 * - Must be placed INSIDE AuthProvider (needs navigate) but OUTSIDE ServiceOptionsProvider.
 * - Fetches /permissions/user once on mount.
 * - On 401 Unauthorized → clears local session and redirects to /login immediately,
 *   children are NOT rendered so no other API (constants, etc.) is called.
 * - On success → renders children and exposes permission helpers via context.
 */
export const PermissionsProvider = ({ children }) => {
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState([]); // array of permission objects
  const [loading, setLoading] = useState(true);       // true while fetching
  const [authorized, setAuthorized] = useState(true); // false if got 401

  const hasFetched = useRef(false);

  useEffect(() => {
    // Guard: only fetch once even in StrictMode double-invoke
    if (hasFetched.current) return;
    hasFetched.current = true;

    const loadPermissions = async () => {
      // If no session exists at all, skip the API call — ProtectedRoute will handle redirect
      const session = localStorage.getItem('user_data');
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          // Use the same base as apiCall but call directly to intercept 401 ourselves
          `${process.env.REACT_APP_BASE_API_URL || ''}/api/admin/permissions/user`,
          {
            method: 'GET',
            headers: (() => {
              const headers = { 'Content-Type': 'application/json' };
              try {
                const { token, username } = JSON.parse(session);
                if (token) headers['Authorization'] = `Bearer ${token}`;
                if (username) headers['username'] = username;
              } catch {}
              return headers;
            })(),
          }
        );

        // 401 → session is invalid → clear everything and go to login
        // Block child rendering so no subsequent APIs (constants, etc.) fire
        if (res.status === 401) {
          localStorage.removeItem('user_data');
          setAuthorized(false);
          navigate('/login', { replace: true });
          return;
        }

        const data = await res.json();
        if (data.success) {
          setPermissions(data.data || []);
        }
        // Non-401 errors: still let the app load, just with empty permissions
      } catch {
        // Network error: let the app load, ServerUnreachable page will handle it
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [navigate]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns true if the user has access to the given permission_id.
   * @param {string} permissionId - e.g. "client_view"
   */
  const hasPermission = (permissionId) =>
    permissions.some((p) => p.permission_id === permissionId && p.access === true);

  const normalizeModule = (module) => String(module || '').trim().toLowerCase();

  /**
   * Returns all permissions for a given module.
   * @param {string} module - e.g. "client"
   */
  const getModulePermissions = (module) => {
    const targetModule = normalizeModule(module);
    return permissions.filter((p) => normalizeModule(p.module) === targetModule);
  };

  /**
   * Returns true if the user has at least one permission with access=true in the module.
   */
  const hasModuleAccess = (module) => {
    const targetModule = normalizeModule(module);
    return permissions.some((p) => normalizeModule(p.module) === targetModule && p.access === true);
  };

  // ── Block children if 401 was received ────────────────────────────────────
  // This prevents ServiceOptionsProvider and all other children from mounting
  // and firing their own API calls before the redirect completes.
  if (!authorized) return null;

  // ── Show nothing while loading (no flash of unauthorized content) ─────────
  if (loading) return null;

  return (
    <PermissionsContext.Provider
      value={{
        permissions,        // full array: [{ permission_id, module, name, description, access }]
        hasPermission,      // (permissionId: string) => boolean
        getModulePermissions, // (module: string) => permission[]
        hasModuleAccess,    // (module: string) => boolean
        loading,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
