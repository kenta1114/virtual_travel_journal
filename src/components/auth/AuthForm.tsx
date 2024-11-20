import React from 'react';
import { X } from 'lucide-react';
import { User } from '../../types';

interface AuthFormProps {
  isLogin: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: User) => void;
}

export function AuthForm({ isLogin, onClose, onAuthSuccess }: AuthFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    onAuthSuccess({ email });
  };

  return (
    <div className="relative bg-white p-6 rounded-lg">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        <X className="w-5 h-5" />
      </button>
      
      <h2 className="text-2xl font-bold text-[#2c5f2d] mb-6">
        {isLogin ? 'ログイン' : '新規登録'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2c5f2d] focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2c5f2d] focus:border-transparent"
          />
        </div>
        
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2c5f2d] focus:border-transparent"
            />
          </div>
        )}
        
        <button
          type="submit"
          className="w-full py-2 bg-[#2c5f2d] text-white rounded-lg hover:bg-[#234a24] transition-colors"
        >
          {isLogin ? 'ログイン' : '登録'}
        </button>
      </form>
    </div>
  );
}