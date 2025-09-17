import { LogOut } from 'lucide-react';


interface HeaderProps {
  email: string;
  onLogout: () => void;
  onSearch: (params: { keyword: string; location: string; startDate: string; endDate: string }) => void;
}


import { useState } from "react";

export function Header({ email, onLogout, onSearch }: HeaderProps) {
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ keyword, location, startDate, endDate });
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-[#2c5f2d]">
          Virtual Travel Journal
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{email}</span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
        </div>
      </div>
      <form className="flex gap-2 items-center" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="キーワード"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <input
          type="text"
          placeholder="場所"
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <span>〜</span>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="px-2 py-1 border rounded"
        />
        <button
          type="submit"
          className="px-4 py-1 bg-[#2c5f2d] text-white rounded hover:bg-[#276027]"
        >
          検索
        </button>
      </form>
    </div>
  );
}
