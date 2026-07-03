// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ServiceOptionsProvider } from "./contexts/ConstantOptionsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PermissionsProvider } from "./contexts/PermissionsContext";

import ProtectedRoute from "./components/ProtectedRoute";
import PermissionRoute from "./components/PermissionRoute";
import PublicRoute from "./components/PublicRoute";
import RoleRoute from "./components/RoleRoute";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Staffs from "./pages/Staffs";
import StaffProfile from "./pages/StaffProfile";
import ClientProfile from "./pages/ClientProfile";
import MyOrders from "./pages/MyOrders";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";
import Clients from "./pages/Clients";
import Firms from "./pages/Firms";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Documents from "./pages/Documents";
import OrderDocumentUpload from "./pages/OrderDocumentUpload";
import Blogs from "./pages/Blogs";
import AccessManagement from "./pages/AccessManagement";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* PermissionsProvider must be:
              - INSIDE AuthProvider (so session exists before we call the API)
              - INSIDE BrowserRouter (needs useNavigate for redirect)
              - OUTSIDE ServiceOptionsProvider (blocks it on 401, preventing extra API calls) */}
          <PermissionsProvider>
            <ServiceOptionsProvider>
              <ToastProvider>
                <Routes>
                {/* Public Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                {/* Server Unreachable - Public Route */}
                <Route path="/server-error" element={<ServerUnreachable />} />

                {/* Protected Routes with MainLayout */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    
                    {/* Clients Routes */}
                    <Route path="clients" element={<PermissionRoute modules="client"><Clients /></PermissionRoute>} />
                    <Route path="clients/:username" element={<PermissionRoute modules="client"><ClientProfile /></PermissionRoute>} />
                    
                    {/* Staff Routes */}
                    <Route path="staffs" element={<PermissionRoute modules="staff"><Staffs /></PermissionRoute>} />
                    <Route path="staffs/:username" element={<PermissionRoute modules="staff"><StaffProfile /></PermissionRoute>} />
                    
                    {/* Other Routes */}
                    <Route path="my-orders" element={<RoleRoute allowedRoles={['staff']}><PermissionRoute><MyOrders /></PermissionRoute></RoleRoute>} />
                    <Route path="orders" element={<PermissionRoute modules="order"><Orders /></PermissionRoute>} />
                    <Route path="orders/:orderId/upload-documents" element={<PermissionRoute modules="order"><OrderDocumentUpload /></PermissionRoute>} />
                    <Route path="documents" element={<Documents />} />
                    <Route path="services" element={<PermissionRoute modules="service"><Services /></PermissionRoute>} />
                    <Route path="firms" element={<PermissionRoute modules="firm"><Firms /></PermissionRoute>} />
                    <Route path="payments" element={<PermissionRoute modules="payment"><Payments /></PermissionRoute>} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="blogs" element={<PermissionRoute modules="blog"><Blogs /></PermissionRoute>} />
                    <Route path="permissions" element={<PermissionRoute modules={['permission', 'permissions']}><AccessManagement /></PermissionRoute>} />
                    <Route path="permission-packages" element={<PermissionRoute modules={['permission_package', 'permission', 'permissions']}><AccessManagement /></PermissionRoute>} />
                  </Route>
                </Route>

                {/* 404 Not Found Route */}
                <Route path="/404" element={<NotFound />} />

                {/* Catch all route - redirect to 404 */}
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
              </ToastProvider>
            </ServiceOptionsProvider>
          </PermissionsProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
