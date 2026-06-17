// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ServiceOptionsProvider } from "./contexts/ServiceOptionsContext";
import { ThemeProvider } from "./contexts/ThemeContext";


import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import PublicRoute from "./components/PublicRoute";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Services from "./pages/Services";
import Reports from "./pages/Reports";
import Staffs from "./pages/Staffs";
import StaffProfile from "./pages/StaffProfile";
import MyOrders from "./pages/MyOrders";
import Orders from "./pages/Orders";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";


function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
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
                <Route path="users" element={<RoleRoute allowedRoles={['admin']}><Users /></RoleRoute>} />
                <Route path="staffs" element={<RoleRoute allowedRoles={['admin']}><Staffs /></RoleRoute>} />
                <Route path="staffs/:username" element={<RoleRoute allowedRoles={['admin']}><StaffProfile /></RoleRoute>} />
                <Route path="my-orders" element={<RoleRoute allowedRoles={['staff']}><MyOrders /></RoleRoute>} />
                <Route path="orders" element={<RoleRoute allowedRoles={['admin']}><Orders /></RoleRoute>} />
                <Route path="services" element={<RoleRoute allowedRoles={['admin']}><Services /></RoleRoute>} />
                <Route path="reports" element={<RoleRoute allowedRoles={['admin']}><Reports /></RoleRoute>} />
              </Route>
            </Route>

            {/* 404 Not Found Route */}
            <Route path="/404" element={<NotFound />} />
            
            {/* Catch all route - redirect to 404 */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </ToastProvider>
        </ServiceOptionsProvider>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;