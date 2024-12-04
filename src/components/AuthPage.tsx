import { useState } from "react";
import { AuthForm } from "../components/AuthForm";
import { User } from "../types";

interface AuthPageProps {
  onAuthSuccess: (userData: User) => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLoginPage, setIsLoginPage] = useState(false);
  const [isSignUpPage, setIsSignUpPage] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f0] to-[#e6f3e6] p-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold text-[#2c5f2d] mb-8 text-center">
            Virtual Travel Journal
          </h1>
          {isLoginPage || isSignUpPage ? (
            <AuthForm
              isLogin={isLoginPage}
              onClose={() => {
                setIsLoginPage(false);
                setIsSignUpPage(false);
              }}
              onAuthSuccess={onAuthSuccess}
            />
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsLoginPage(true);
                  setIsSignUpPage(false);
                }}
                className="w-full py-3 bg-[#2c5f2d] text-white rounded-lg hover:bg-[#234a24] transition-colors"
              >
                ログイン
              </button>
              <button
                onClick={() => {
                  setIsLoginPage(false);
                  setIsSignUpPage(true);
                }}
                className="w-full py-3 border border-[#2c5f2d] text-[#2c5f2d] rounded-lg hover:bg-[#f0f9f0] transition-colors"
              >
                新規登録
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
