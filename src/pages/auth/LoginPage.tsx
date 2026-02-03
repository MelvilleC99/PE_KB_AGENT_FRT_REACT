import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Mail, Lock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PropertyEngineLogo } from "@/components/branding/property-engine-logo"
import { signIn } from "@/lib/auth/firebase-auth"
import { ForgotPasswordModal } from "@/components/auth/ForgotPasswordModal"
import { useUser } from "@/contexts/UserContext"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const { toast } = useToast()
  const { login } = useUser()
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to continue.",
        variant: "destructive"
      })
      return
    }

    if (!password.trim()) {
      toast({
        title: "Password Required",
        description: "Please enter your password to continue.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      console.log(`🔐 Attempting login for: ${email}`)
      
      // Sign in with Firebase
      const user = await signIn(email, password)
      
      toast({
        title: "Login Successful!",
        description: `Welcome back, ${user.full_name}`,
      })
      
      // Update context
      login(user)
      
      // Navigate to dashboard or home
      navigate('/')

    } catch (error: any) {
      console.error('Login error:', error)
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="space-y-4 text-center">
          <div className="flex items-center justify-center">
            <PropertyEngineLogo className="h-16 w-auto" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              Knowledge Base Agent
            </CardTitle>
            <CardDescription className="mt-2">
              Sign in to access the knowledge base
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Login Button */}
          <Button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Button 
              type="button"
              variant="link" 
              size="sm"
              onClick={() => setShowForgotPassword(true)}
              className="text-primary hover:text-primary/80"
            >
              Forgot password?
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            PropertyEngine Knowledge Base v1.0
          </div>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        open={showForgotPassword} 
        onOpenChange={setShowForgotPassword} 
      />
    </div>
  )
}
