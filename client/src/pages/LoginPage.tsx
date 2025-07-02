import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const { emailSignIn, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const showMessage = (title: string, description: string, isError = false) => {
    alert(`${title}: ${description}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showMessage("Email Required", "Please enter your email address", true);
      return;
    }
    try {
      await emailSignIn.mutateAsync({ email: email.trim().toLowerCase() });
      showMessage("Login Successful", "Welcome back!");
      setLocation("/");
      window.location.reload(); // Refresh to update auth state
    } catch (error: any) {
      showMessage("Login Failed", error.message || "An unexpected error occurred.", true);
    }
  };

  const handleGoogleSignIn = () => {
    // For future implementation - Google OAuth
    showMessage("Coming Soon", "Google Sign-In will be available soon. Please use email for now.");
  };

  return (
    <div className="min-h-screen relative">
      <SharedBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div 
            className="bg-black/20 border border-orange-500/30 rounded-lg p-8 backdrop-blur-xl"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(247, 158, 2, 0.3)',
              borderRadius: '8px',
              padding: '32px',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div className="text-center mb-8">
              <h1 
                className="text-3xl font-black text-white mb-2"
                style={{ 
                  fontSize: '24px',
                  fontWeight: '900',
                  color: 'white',
                  marginBottom: '8px'
                }}
              >
                Sign In To DHR
              </h1>
              <p 
                className="text-orange-200"
                style={{ color: 'rgba(247, 158, 2, 0.8)' }}
              >
                Enter Your Email To Access Premium Content
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label 
                  className="block text-sm font-medium text-white mb-2"
                  style={{ 
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-orange-500/50 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(247, 158, 2, 0.5)',
                    color: 'white'
                  }}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(247, 158, 2, 1)',
                  color: 'black',
                  fontWeight: '600',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {isLoading ? "Checking Subscription..." : "Sign In With Email"}
              </button>
            </form>

            <div className="mt-6">
              <div 
                className="relative"
                style={{ position: 'relative' }}
              >
                <div 
                  className="absolute inset-0 flex items-center"
                  style={{ 
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    bottom: '0',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <div 
                    className="w-full border-t border-gray-600"
                    style={{ 
                      width: '100%',
                      borderTop: '1px solid rgba(156, 163, 175, 1)'
                    }}
                  />
                </div>
                <div 
                  className="relative flex justify-center text-sm"
                  style={{ 
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}
                >
                  <span 
                    className="px-2 bg-black/20 text-gray-400"
                    style={{ 
                      padding: '0 8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      color: 'rgba(156, 163, 175, 1)'
                    }}
                  >
                    Or Continue With
                  </span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full mt-4 py-3 px-4 rounded-lg font-medium transition-all duration-200 border"
                style={{
                  width: '100%',
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: '500'
                }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue With Google
                </div>
              </button>
            </div>

            <div 
              className="mt-8 text-center text-sm text-gray-400"
              style={{ 
                marginTop: '32px',
                textAlign: 'center',
                fontSize: '14px',
                color: 'rgba(156, 163, 175, 1)'
              }}
            >
              <p>
                We Check Your Email Against Active Patreon And Buy Me A Coffee Subscriptions
              </p>
              <p className="mt-2">
                DHR1 (€3+) • DHR2 (€5+) • VIP (€10+)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}