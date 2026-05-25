import { useState, useEffect, useCallback, useRef } from "react";
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
  const apiBaseUrl =
    typeof window !== "undefined" &&
    (import.meta.env.DEV || window.location.hostname === "localhost")
      ? "http://localhost:5001"
      : "";

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
  const [searchParams, setSearchParams] = useState<{
    keyword: string;
    location: string;
    startDate: string;
    endDate: string;
  } | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // 検索API呼び出し
  const fetchEntries = async (params?: {
    keyword: string;
    location: string;
    startDate: string;
    endDate: string;
  }) => {
    try {
      let url = `${apiBaseUrl}/api/travel`;

      if (
        params &&
        (params.keyword ||
          params.location ||
          params.startDate ||
          params.endDate)
      ) {
        url = `${apiBaseUrl}/api/travel/search`;
        const searchParams = new URLSearchParams();
        if (params.keyword) searchParams.append("keyword", params.keyword);
        if (params.location) searchParams.append("location", params.location);
        if (params.startDate)
          searchParams.append("startDate", params.startDate);
        if (params.endDate) searchParams.append("endDate", params.endDate);
        url += `?${searchParams.toString()}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      } else {
        console.error("Failed to fetch entries:", res.statusText);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [suggestions] = useState<{ place_id: string; description: string }[]>(
    [],
  );

  useEffect(() => {
    // Persist entries to localStorage with size-safeguards.
    persistToLocalStorage(entries);
  }, [entries]);

  // Helper: persist entries safely with size limits and truncation.
  const persistToLocalStorage = (list: any[]) => {
    if (typeof window === "undefined") return;

    const MAX_BYTES = 1000 * 1000; // 1MB target

    const minimalize = (items: any[], noteLen = 2000) =>
      items.map(({ image, notes, ...rest }: any) => ({
        ...rest,
        notes: typeof notes === "string" ? notes.slice(0, noteLen) : notes,
        image: null,
      }));

    const tryStringSize = (obj: any) => {
      try {
        const s = JSON.stringify(obj);
        return new Blob([s]).size;
      } catch {
        return Infinity;
      }
    };

    try {
      // Start with last 50 entries and reasonable note length
      let count = Math.min(50, list.length || 0);
      let noteLen = 2000;
      let candidate = minimalize(list.slice(-count), noteLen);
      let size = tryStringSize(candidate);

      // Reduce note length until it fits or until minimal note length
      while (size > MAX_BYTES && noteLen >= 100) {
        noteLen = Math.floor(noteLen / 2);
        candidate = minimalize(list.slice(-count), noteLen);
        size = tryStringSize(candidate);
      }

      // If still too large, reduce count
      while (size > MAX_BYTES && count > 1) {
        count = Math.max(1, Math.floor(count / 2));
        candidate = minimalize(list.slice(-count), noteLen);
        size = tryStringSize(candidate);
      }

      if (size === Infinity || size > MAX_BYTES) {
        // As a last resort, persist an empty list to avoid repeated quota errors
        localStorage.setItem("journalEntries", JSON.stringify([]));
        console.warn(
          "persistToLocalStorage: Could not fit entries in localStorage; saved empty list",
        );
      } else {
        localStorage.setItem("journalEntries", JSON.stringify(candidate));
      }
    } catch (err) {
      console.error("persistToLocalStorage failed:", err);
      try {
        localStorage.setItem("journalEntries", JSON.stringify([]));
      } catch (e) {
        // give up
        console.error("persistToLocalStorage final fallback failed:", e);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
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
    reader.onloadend = () => {
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
    if (isSubmitting || submitLockRef.current) {
      console.debug("handleSubmit: already submitting, ignoring duplicate");
      return;
    }

    submitLockRef.current = true;

    try {
      console.debug("handleSubmit: starting submit for", newEntry.title);
      setIsSubmitting(true);
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
        const updatedEntries = entries.map(
          (entry: typeof newEntry, index: number) =>
            index === editIndex ? newEntry : entry,
        );
        setEntries(updatedEntries);
      } else {
        // Create new entry
        console.debug(
          "handleSubmit: sending POST to",
          `${apiBaseUrl}/api/travel`,
        );
        const response = await fetch(`${apiBaseUrl}/api/travel`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entryData),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const savedEntry = await response.json();
        console.log("Entry saved:", savedEntry);
        await fetchEntries();
      }
      resetForm();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert(
        `エントリの保存に失敗しました。\n詳細: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsSubmitting(false);
      submitLockRef.current = false;
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

  const handleEditEntry = (index: number) => {
    setEditMode(true);
    setEditIndex(index);
    setNewEntry(entries[index]);
  };

  const deleteEntry = async (
    entryId: number,
    entries: any,
    setEntries: any,
  ) => {
    const updatedEntries = entries.filter((entry: any) => entry.id !== entryId);
    setEntries(updatedEntries);

    if (typeof window !== "undefined") {
      persistToLocalStorage(updatedEntries);
    }
  };

  const handleDeleteEntry = async (index: number) => {
    if (window.confirm("このエントリを削除してもよろしいですか？")) {
      const entryId = entries[index].id;
      await deleteEntry(entryId, entries, setEntries);
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
              {isLoginPage || isSignUpPage ? (
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
              onSearch={(params) => setSearchParams(params)}
            />
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <EntryForm
                newEntry={newEntry}
                editMode={editMode}
                suggestions={suggestions}
                onEntryChange={setNewEntry}
                onLocationChange={(e) =>
                  setNewEntry({ ...newEntry, location: e.target.value })
                }
                onSelectLocation={handleSelectLocation}
                onImageUpload={handleImageUpload}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
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
