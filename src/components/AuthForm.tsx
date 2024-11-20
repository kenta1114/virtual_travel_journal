import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AuthFormProps {
  isLogin: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: { email: string }) => void;
}

export function AuthForm({ isLogin, onClose, onAuthSuccess }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    // 実際のアプリケーションでは、ここでバックエンドAPIとの通信を行います
    // この例では、単純な検証のみを行います
    if (formData.password.length < 6) {
      setError('パスワードは6文字以上である必要があります。');
      return;
    }

    // 認証成功とみなし、ユーザー情報を保存
    localStorage.setItem('user', JSON.stringify({ email: formData.email }));
    onAuthSuccess({ email: formData.email });
    onClose();
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
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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