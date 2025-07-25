import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { JournalChat } from "./components/JournalChat";
import { SessionManager } from "./components/SessionManager";
import { useState, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  const [sessionId, setSessionId] = useState<string>("");
  const loggedInUser = useQuery(api.auth.loggedInUser);

  useEffect(() => {
    // Generate session ID for users
    if (!sessionId) {
      setSessionId(crypto.randomUUID());
    }
  }, [sessionId]);

  const handleSessionChange = (newSessionId: string) => {
    setSessionId(newSessionId);
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Authenticated>
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
            <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">✨</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-800">
                  Mindful Journal
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <SessionManager
                  currentSessionId={sessionId}
                  onSessionChange={handleSessionChange}
                />
                <span className="text-sm text-gray-600">
                  Welcome, {loggedInUser?.email?.split("@")[0]}
                </span>
                <SignOutButton />
              </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-6 text-center">
              <p className="text-gray-600">
                Each session is a complete journaling conversation. Switch
                between sessions or start a new one anytime.
              </p>
            </div>
            <JournalChat sessionId={sessionId} />
          </main>
        </Authenticated>

        <Unauthenticated>
          <div className="flex items-center justify-center min-h-screen px-4 py-8">
            <div className="max-w-lg w-full">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                  <span className="text-white text-3xl">✨</span>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mb-6">
                  Mindful Journal
                </h1>
                <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
                  Your AI-powered journaling companion. Each session is a
                  complete conversation where you can reflect, grow, and
                  discover insights about yourself.
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 mb-8">
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Sign in to continue your journaling journey
                  </p>
                </div>
                <SignInForm />
              </div>

              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500">
                  Start your mindful journaling journey today
                </p>
                <div className="flex items-center justify-center space-x-6 text-xs text-gray-400">
                  <span>✓ Private & Secure</span>
                  <span>✓ AI-Powered Insights</span>
                  <span>✓ Session-Based</span>
                </div>
              </div>
            </div>
          </div>
        </Unauthenticated>

        <Toaster position="top-center" />
      </div>
    </ErrorBoundary>
  );
}
