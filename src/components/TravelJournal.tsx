import React, { useState, useEffect, useCallback } from "react";
import { AuthForm } from "./AuthForm";
import { Header } from "./Header";
import { EntryForm } from "./EntryForm";
import { EntryList } from "./EntryList";

interface User {
  email: string;
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
  const [newEntry, setNewEntry] = useState({
    title: "",
    date: "",
    location: "",
    notes: "",
    image: null,
  });

  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

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

  const handleLocationChange = async (e) => {
    const value = e.target.value;
    setNewEntry({ ...newEntry, location: value });

    if (value.length > 2) {
      const fakeSuggestions = [
        { place_id: "1", description: "東京, 日本" },
        { place_id: "2", description: "大阪, 日本" },
        { place_id: "3", description: "京都, 日本" },
        { place_id: "4", description: "札幌, 日本" },
      ];
      setSuggestions(fakeSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectLocation = (place) => {
    setNewEntry({ ...newEntry, location: place.description });
    setSuggestions([]);
  };

  const handleImageUpload = useCallback((file) => {
    const fakeUrl = URL.createObjectURL(file);
    setNewEntry((prev) => ({ ...prev, image: fakeUrl }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newEntry.title || !newEntry.date || !newEntry.location) {
      alert("タイトル、日付、場所は必須項目です。");
      return;
    }

    if (editMode && editIndex !== null) {
      const updatedEntries = entries.map((entry, index) =>
        index === editIndex ? newEntry : entry
      );
      setEntries(updatedEntries);
    } else {
      setEntries([...entries, { ...newEntry, id: Date.now() }]);
    }
    resetForm();
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

  const handleEditEntry = (index) => {
    setEditMode(true);
    setEditIndex(index);
    setNewEntry(entries[index]);
  };

  const handleDeleteEntry = (index) => {
    if (window.confirm("このエントリを削除してもよろしいですか？")) {
      const updatedEntries = entries.filter((_, i) => i !== index);
      setEntries(updatedEntries);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f9f0] to-[#e6f3e6] p-6">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f0] to-[#e6f3e6] p-6">
      <div className="max-w-6xl mx-auto">
        <Header email={user.email} onLogout={handleLogout} />
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <EntryForm
            newEntry={newEntry}
            editMode={editMode}
            suggestions={suggestions}
            onEntryChange={setNewEntry}
            onLocationChange={handleLocationChange}
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
      </div>
    </div>
  );
}