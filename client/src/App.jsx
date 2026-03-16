import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import AppShell from './components/layout/AppShell';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionForm from './pages/TransactionForm';
import ScanReceipt from './pages/ScanReceipt';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceView from './pages/InvoiceView';
import Clients from './pages/Clients';
import ClientForm from './pages/ClientForm';
import ClientView from './pages/ClientView';

// Lazy-loaded Max-tier pages
const Recurring = lazy(() => import('./pages/Recurring'));
const RecurringForm = lazy(() => import('./pages/RecurringForm'));
const Import = lazy(() => import('./pages/Import'));
const ImportHistory = lazy(() => import('./pages/ImportHistory'));
const Templates = lazy(() => import('./pages/Templates'));
const TemplateEditor = lazy(() => import('./pages/TemplateEditor'));
const InvoicePortal = lazy(() => import('./pages/InvoicePortal'));
const BusinessForm = lazy(() => import('./pages/BusinessForm'));
const Automation = lazy(() => import('./pages/Automation'));
const AutomationRuleForm = lazy(() => import('./pages/AutomationRuleForm'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

function LazyFallback() {
  return <div className="spinner" />;
}

export default function App() {
  return (
    <Suspense fallback={<LazyFallback />}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        {/* Public portal (no auth) */}
        <Route path="/portal/:token" element={<InvoicePortal />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/new" element={<TransactionForm />} />
          <Route path="/transactions/:id" element={<TransactionForm />} />
          <Route path="/scan" element={<ScanReceipt />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceForm />} />
          <Route path="/invoices/:id" element={<InvoiceView />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<ClientForm />} />
          <Route path="/clients/:id" element={<ClientView />} />
          <Route path="/clients/:id/edit" element={<ClientForm />} />
          <Route path="/recurring" element={<Recurring />} />
          <Route path="/recurring/new" element={<RecurringForm />} />
          <Route path="/recurring/:id" element={<RecurringForm />} />
          <Route path="/import" element={<Import />} />
          <Route path="/import/history" element={<ImportHistory />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/templates/new" element={<TemplateEditor />} />
          <Route path="/templates/:id" element={<TemplateEditor />} />
          <Route path="/businesses/new" element={<BusinessForm />} />
          <Route path="/businesses/:id/edit" element={<BusinessForm />} />
          <Route path="/automation" element={<Automation />} />
          <Route path="/automation/new" element={<AutomationRuleForm />} />
          <Route path="/automation/:id" element={<AutomationRuleForm />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
