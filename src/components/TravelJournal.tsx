import { useState, useEffect, useCallback } from "react";
import { AuthForm } from "./AuthForm";
import { Header } from "./Header";
import { EntryForm } from "./EntryForm";
import { EntryList } from "./EntryList";

interface User {
  email: string;
}

interface Suggestion {
  place_id: string;
  description: string;
}

export function TravelJournal() {
  const loadSavedEntries = () => {
    if (typeof window !== "undefined") {
      const savedEntries = localStorage.getItem("journalEntries");
      return savedEntries ? JSON.parse(savedEntries) : [];
    }
    return [];
  };

  const loadSavedUser = () => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  };

  const [isLoginPage, setIsLoginPage] = useState(false);
  const [isSignUpPage, setIsSignUpPage] = useState(false);
  const [user, setUser] = useState<User | null>(loadSavedUser);
  const [entries, setEntries] = useState(loadSavedEntries);
  const [searchParams, setSearchParams] = useState<{ keyword: string; location: string; startDate: string; endDate: string } | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  // 検索API呼び出し
  const fetchEntries = async (params?: { keyword: string; location: string; startDate: string; endDate: string }) => {
    try {
      let url = "http://localhost:5001/api/travel/search";
      if (params && (params.keyword || params.location || params.startDate || params.endDate)) {
        const query = new URLSearchParams();
        if (params.keyword) query.append("keyword", params.keyword);
        if (params.location) query.append("location", params.location);
        if (params.startDate) query.append("startDate", params.startDate);
        if (params.endDate) query.append("endDate", params.endDate);
        url += "?" + query.toString();
      } else {
        // パラメータがない場合は全件取得
        url = "http://localhost:5001/api/travel";
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // imageURL -> image へ変換
        const converted = data.map((entry: any) => ({
          ...entry,
          image: entry.imageURL || null,
          notes: entry.memo || entry.notes || ""
        }));
        setEntries(converted);
      } else {
        console.error("API error:", res.status, res.statusText);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };
  // 検索条件変更時にAPI呼び出し
  useEffect(() => {
    if (searchParams) {
      fetchEntries(searchParams);
    }
  }, [searchParams]);
  const [newEntry, setNewEntry] = useState<{
    title: string;
    date: string;
    location: string;
    notes: string;
    image: string | null;
  }>({
    title: "",
    date: "",
    location: "",
    notes: "",
    image: null,
  });

  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [suggestions] = useState<{ place_id: string; description: string }[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("journalEntries", JSON.stringify(entries));
    }
  }, [entries]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };



  const handleSelectLocation = (place: Suggestion) => {
    setNewEntry({ ...newEntry, location: place.description });
    // For now, we'll use mock coordinates. In a real app, you'd get these from the Google Places API
    setSelectedCoordinates({ lat: 35.6762, lng: 139.6503 }); // Tokyo coordinates as example
    // setSuggestions([]);
  };

  interface ImageUploadHandler {
    (file: File): void;
  }

  const handleImageUpload: ImageUploadHandler = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onloadend=()=>{
      const base64Data = reader.result as string;
      setNewEntry((prev) => ({ ...prev, image: base64Data }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEntry.title || !newEntry.date || !newEntry.location) {
      alert("タイトル、日付、場所は必須項目です。");
      return;
    }

    try {
      const entryData = {
        title: newEntry.title,
        date: newEntry.date,
        location: newEntry.location,
        memo: newEntry.notes,
        imageURL: newEntry.image,
        latitude: selectedCoordinates?.lat || null,
        longitude: selectedCoordinates?.lng || null,
      };

      if (editMode && editIndex !== null) {
        // Update existing entry
        const updatedEntries = entries.map((entry: typeof newEntry, index: number) =>
          index === editIndex ? newEntry : entry
        );
        setEntries(updatedEntries);
      } else {
        // Create new entry
        // API接続確認
        console.log('Attempting to connect to API server...');
        
        const response = await fetch('http://localhost:5001/api/travel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entryData),
          // タイムアウト設定を追加（オプション）
        });

        if (!response.ok) {
          let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || errorMsg;
            if (errorData.details) errorMsg += `\n${errorData.details}`;
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
          }
          alert(`エントリの保存に失敗しました。\n${errorMsg}`);
          return;
        }

        const savedEntry = await response.json();
        console.log('Entry saved:', savedEntry);
        // Refresh entries list
        await fetchEntries();
      }
      resetForm();
    } catch (error) {
      console.error('Error saving entry:', error);
      
      // エラーの詳細情報を提供
      let errorMessage = 'エントリの保存に失敗しました。';
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage += '\n\nAPI サーバーに接続できません。以下を確認してください：\n' +
          '1. バックエンドサーバーが起動しているか (http://localhost:5001)\n' +
          '2. CORS設定が正しいか\n' +
          '3. ネットワーク接続が正常か';
      } else {
        errorMessage += `\n詳細: ${error instanceof Error ? error.message : String(error)}`;
      }
      
      alert(errorMessage);
    }
  };

  const resetForm = () => {
    setNewEntry({
      title: "",
      date: "",
      location: "",
      notes: "",
      image: null,
    });
    setEditMode(false);
    setEditIndex(null);
  };

  const handleEditEntry = (index:number) => {
    setEditMode(true);
    setEditIndex(index);
    setNewEntry(entries[index]);
  };

  const deleteEntry = async (entryId:number, entries:any, setEntries:any) => {
    const updatedEntries = entries.filter((entry:any) => entry.id !== entryId);
    setEntries(updatedEntries);

    if (typeof window !== "undefined") {
      localStorage.setItem("journalEntries", JSON.stringify(updatedEntries));
    }
  };

  const handleDeleteEntry = async (index:number) => {
    if (window.confirm("このエントリを削除してもよろしいですか？")) {
      const entryId = entries[index].id;
      await deleteEntry(entryId,entries,setEntries);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f0] to-[#e6f3e6] p-6">
      <div className="max-w-6xl mx-auto">
        {!user ? (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h1 className="text-4xl font-bold text-[#2c5f2d] mb-8 text-center">
                Virtual Travel Journal
              </h1>
              {(isLoginPage || isSignUpPage) ? (
                <AuthForm 
                  isLogin={isLoginPage}
                  onClose={() => {
                    setIsLoginPage(false);
                    setIsSignUpPage(false);
                  }}
                  onAuthSuccess={handleAuthSuccess}
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
        ) : (
          <>
            <Header
              email={user.email}
              onLogout={handleLogout}
              onSearch={params => setSearchParams(params)}
            />
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <EntryForm
                newEntry={newEntry}
                editMode={editMode}
                suggestions={suggestions}
                onEntryChange={setNewEntry}
                onLocationChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                onSelectLocation={handleSelectLocation}
                onImageUpload={handleImageUpload}
                onSubmit={handleSubmit}
              />
              <EntryList
                entries={entries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
