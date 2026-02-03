import { useState } from "react"
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/UserContext"
import { signOut as firebaseSignOut } from "@/lib/auth/firebase-auth"
import { isAdmin } from "@/lib/auth/permissions"
import { SettingsDropdown } from "@/components/auth/SettingsDropdown"
import { PropertyEngineLogo } from "@/components/branding/property-engine-logo"
import { 
  BarChart3, 
  Plus, 
  Database, 
  Archive, 
  Bot,
  Ticket,
  Cloud,
  Menu,
  Headphones,
  Users,
  Shield
} from "lucide-react"

const navigation = [
  { name: 'Overview', href: '/', icon: BarChart3 },
  { name: 'Add Entry', href: '/add-entry', icon: Plus },
  { name: 'Firebase DB', href: '/firebase', icon: Cloud },
  { name: 'Vector DB', href: '/vectors', icon: Database },
  { name: 'Test Freshdesk', href: '/test-freshdesk', icon: Ticket },
  { name: 'Archive', href: '/archive', icon: Archive },
  { name: 'Test Agent', href: '/test-agent', icon: Bot },
  { name: 'Support Agent', href: '/support-agent', icon: Headphones },
  { name: 'Customer Agent', href: '/customer-agent', icon: Users },
  { name: 'User Management', href: '/admin/users', icon: Shield, adminOnly: true },
]

export function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const handleLogout = async () => {
    try {
      await firebaseSignOut()
      logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Header Banner */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <PropertyEngineLogo className="h-10 w-auto" />
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-bold text-gray-900">KB Management & Support System</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col
      `}>
        <div className="flex-1 overflow-y-auto p-6">
          <nav className="space-y-1">
            {navigation
              .filter(item => !item.adminOnly || isAdmin(user))
              .map((item) => {
              const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href))
              
              return (
                <Link key={item.name} to={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>
        
        {/* User Profile & Logout Section */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-[var(--pe-action)] flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.company}</p>
              </div>
            </div>
            <SettingsDropdown onLogout={handleLogout} userEmail={user?.email} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 pt-16">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Page content */}
        <main className="h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)] overflow-auto">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
