import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MedicalDirectors from './pages/MedicalDirectors';
import ClientMedicalDirectors from './pages/ClientMedicalDirectors';
import Clients from './pages/Clients';
import CustomerQueue from './pages/CustomerQueue';
import GFEs from './pages/GFEs';
import InProgressGFEs from './pages/InProgressGFEs';
import Tasks from './pages/Tasks';
import Invoices from './pages/Invoices';
import EmailTemplates from './pages/EmailTemplates';
import ProviderInsights from './pages/ProviderInsights';
import Reviews from './pages/Reviews';
import ProviderDirectory from './pages/ProviderDirectory';
import SOPs from './pages/SOPs';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useScrollToTop } from './hooks/useScrollToTop';

function AppRoutes() {
  useScrollToTop();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/customer-queue" element={<ProtectedRoute><CustomerQueue /></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
        <Route path="/gfes" element={<ProtectedRoute><GFEs /></ProtectedRoute>} />
        <Route path="/in-progress-gfes" element={<ProtectedRoute><InProgressGFEs /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/email-templates" element={<ProtectedRoute><EmailTemplates /></ProtectedRoute>} />
        <Route path="/provider-insights" element={<ProtectedRoute><ProviderInsights /></ProtectedRoute>} />
        <Route path="/providers" element={<ProtectedRoute><ProviderDirectory /></ProtectedRoute>} />
        <Route path="/medical-directors" element={<ProtectedRoute><MedicalDirectors /></ProtectedRoute>} />
        <Route path="/medical-directors/clients" element={<ProtectedRoute><ClientMedicalDirectors /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
        <Route path="/sops" element={<ProtectedRoute><SOPs /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;