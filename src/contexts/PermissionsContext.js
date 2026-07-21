import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { GlobalSkeleton } from '../components/SkeletonComponent';

// ─── Context ──────────────────────────────────────────────────────────────────

const PermissionsContext = createContext(null);

export const usePermissions = () => {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within PermissionsProvider');
  return ctx;
};

// Global cache to survive remounts
let permissionsCache = {
  hasFetched: false,
  data: []
};

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * PermissionsProvider
 * - Must be placed INSIDE AuthProvider (needs the authenticated `user` + navigate).
 * - Fetches /permissions/user whenever the logged-in user changes (login/logout),
 *   not just once on mount — so permissions are fresh immediately after login
 *   without requiring a full page refresh.
 * - On 401 Unauthorized → clears local session and redirects to /login immediately,
 *   children are NOT rendered so no other API (constants, etc.) is called.
 * - On success → renders children and exposes permission helpers via context.
 */
export const PermissionsProvider = ({ children }) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [permissions, setPermissions] = useState([]); // array of permission objects
  const [loading, setLoading] = useState(true);       // true while fetching
  const [authorized, setAuthorized] = useState(true); // false if got 401

  useEffect(() => {
    // Wait until AuthContext has resolved the current session from storage.
    if (authLoading) return;

    // No logged-in user (logged out, or session cleared) — reset and stop.
    if (!user) {
      permissionsCache.hasFetched = false;
      permissionsCache.data = [];
      setPermissions([]);
      setAuthorized(true);
      setLoading(false);
      return;
    }

    // Already fetched permissions for this session — skip refetching.
    if (permissionsCache.hasFetched) {
      setPermissions(permissionsCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Delay the fetch by 500ms so React StrictMode's cleanup can cancel the
    // first invocation's timer before it fires — ensuring only 1 API call.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BASE_API_URL || ''}/api/admin/permissions/user`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(user.token ? { Authorization: `Bearer ${user.token}` } : {}),
              ...(user.username ? { username: user.username } : {}),
            },
          }
        );

        // 401 → session is invalid → clear everything and go to login
        if (res.status === 401) {
          localStorage.removeItem('user_data');
          setAuthorized(false);
          window.location.href = '/login';
          return;
        }

        const data = await res.json();
        if (data.success) {
          permissionsCache.hasFetched = true;
          permissionsCache.data = data.data || [];
          setPermissions(data.data || []);
        }
        // Non-401 errors: still let the app load, just with empty permissions
      } catch {
        // Network error: let the app load, ServerUnreachable page will handle it
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      // StrictMode cleanup clears the timer before it fires → 0 API calls from
      // the first run. The second invocation's timer fires normally → 1 API call.
      clearTimeout(timer);
    };
  }, [user, authLoading, navigate]);

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

  // ── Show skeleton while loading (prevents white blank page flash) ──────────
  if (authLoading || loading) return <GlobalSkeleton />;

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
