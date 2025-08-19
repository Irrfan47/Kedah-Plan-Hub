import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { login as apiLogin } from "../api/backend";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in - go to root path so RoleBasedRedirect can handle routing
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await login(email, password);
      if (response.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the Program Management System!",
        });
        navigate("/"); // Go to root path so RoleBasedRedirect can handle routing
      } else {
        // Check if account is locked
        if (response.account_locked) {
          toast({
            title: "Account Locked",
            description: response.message || "Account is locked due to too many failed login attempts. Please contact an administrator.",
            variant: "destructive",
          });
        } else if (response.attempts_remaining !== undefined) {
          // Show attempts remaining message
          toast({
            title: "Login Failed",
            description: response.message || `Invalid email or password. ${response.attempts_remaining} attempts remaining before account lockout.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: response.message || "Invalid email or password. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="w-48 h-32 flex items-center justify-center">
                <img 
                  src={`${import.meta.env.BASE_URL}img/Wisma.png`} 
                  alt="Logo" 
                  className="w-full h-full object-contain scale-150"
                  onError={(e) => {
                    // Fallback to icon if logo fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-40 h-24 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-lg hidden">
                  <Building2 className="w-12 h-8 text-primary-foreground" />
                </div>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                SISTEM PENGURUSAN PERUNTUKAN EXCO
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@gov.my"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-smooth font-medium"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">Demo Credentials:</p>
                  <div className="space-y-1">
                    <p>Admin: admin@gmail.com</p>
                    <p>Exco User: pmb@kedah.gov.my</p>
                    <p>Finance MMK: finance_mmk@gmail.com</p>
                    <p>Finance Officer: finance_officer@gmail.com</p>
                    <p>Super Admin: super_admin@gmail.com</p>
                    <p>Password: password123</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}