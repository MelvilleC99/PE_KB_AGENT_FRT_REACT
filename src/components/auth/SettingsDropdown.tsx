import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Settings, Key, RotateCcw, LogOut } from "lucide-react"
import { ChangePasswordModal } from "./ChangePasswordModal"
import { ForgotPasswordModal } from "./ForgotPasswordModal"

interface SettingsDropdownProps {
  onLogout: () => void
  userEmail?: string
}

export function SettingsDropdown({ onLogout, userEmail }: SettingsDropdownProps) {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowChangePassword(true)}>
            <Key className="mr-2 h-4 w-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowResetPassword(true)}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={onLogout}
            className="text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordModal 
        open={showChangePassword} 
        onOpenChange={setShowChangePassword} 
      />
      
      <ForgotPasswordModal 
        open={showResetPassword} 
        onOpenChange={setShowResetPassword} 
      />
    </>
  )
}
