import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { UserProvider, useUser } from '@/contexts/UserContext'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { Toaster } from '@/components/ui/toaster'
import './index.css'

// Dashboard Pages
import { OverviewPage } from '@/pages/dashboard/OverviewPage'
import { AddKBEntryPage } from '@/pages/dashboard/AddKBEntryPage'
import { FirebasePage } from '@/pages/dashboard/FirebasePage'
import { VectorDatabasePage } from '@/pages/dashboard/VectorDatabasePage'
import { TestFreshdeskPage } from '@/pages/dashboard/TestFreshdeskPage'
import { ArchivePage } from '@/pages/dashboard/ArchivePage'
import { TestAgentPage } from '@/pages/dashboard/TestAgentPage'
import { SupportAgentPage } from '@/pages/dashboard/SupportAgentPage'
import { CustomerAgentPage } from '@/pages/dashboard/CustomerAgentPage'
import { SettingsPage } from '@/pages/dashboard/SettingsPage'
import { UserAdminPage } from '@/pages/admin/UserAdminPage'

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useUser()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AppRoutes() {
  const { isLoggedIn } = useUser()

  return (
    <Routes>
      {/* Login Route - redirects to dashboard if already logged in */}
      <Route 
        path="/login" 
        element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      
      {/* Protected Dashboard Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Default route - Overview */}
        <Route index element={<OverviewPage />} />
        
        {/* Dashboard Pages */}
        <Route path="add-entry" element={<AddKBEntryPage />} />
        <Route path="firebase" element={<FirebasePage />} />
        <Route path="vectors" element={<VectorDatabasePage />} />
        <Route path="test-freshdesk" element={<TestFreshdeskPage />} />
        <Route path="archive" element={<ArchivePage />} />
        <Route path="test-agent" element={<TestAgentPage />} />
        <Route path="support-agent" element={<SupportAgentPage />} />
        <Route path="customer-agent" element={<CustomerAgentPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Admin Routes */}
        <Route path="admin/users" element={<UserAdminPage />} />
      </Route>

      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </UserProvider>
  )
}

export default App
