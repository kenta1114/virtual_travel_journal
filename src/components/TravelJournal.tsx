import { useState, useEffect, useCallback, useRef } from "react";
import { AuthForm } from "./AuthForm";
import { Header } from "./Header";
import { EntryForm } from "./EntryForm";
import { EntryList } from "./EntryList";
import type { Entry as JournalEntryType } from "../types";

interface User {
  email: string;
}

interface ApiEntry {
  id: number;
  title: string;
  date: string;
  location: string;
  memo?: string | null;
  imageURL?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
}

interface Suggestion {
  place_id: string;
  description: string;
}

interface JournalFormEntry {
  title: string;
  date: string;
  location: string;
  notes: string;
  image: string | null;
}

const emptyEntry: JournalFormEntry = {
  title: "",
  date: "",
  location: "",
  notes: "",
  image: null,
};

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
  const [entries, setEntries] = useState<JournalEntryType[]>([]);
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
  const [newEntry, setNewEntry] = useState<JournalFormEntry>(emptyEntry);

  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const [suggestions] = useState<{ place_id: string; description: string }[]>(
    [],
  );

  const fetchEntries = useCallback(
    async (params?: {
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
          const query = new URLSearchParams();
          if (params.keyword) query.append("keyword", params.keyword);
          if (params.location) query.append("location", params.location);
          if (params.startDate) query.append("startDate", params.startDate);
          if (params.endDate) query.append("endDate", params.endDate);
          url += `?${query.toString()}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as ApiEntry[];
        setEntries(
          data.map((entry) => ({
            id: entry.id,
            title: entry.title,
            date: entry.date,
            location: entry.location,
            notes: entry.memo ?? "",
            image: entry.imageURL ?? null,
          })),
        );
      } catch (error) {
        console.error("Fetch error:", error);
      }
    },
    [apiBaseUrl],
  );

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    void fetchEntries(searchParams ?? undefined);
  }, [user, searchParams, fetchEntries]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setEntries([]);
    setSearchParams(null);
    resetForm();
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  const handleSelectLocation = (place: Suggestion) => {
    setNewEntry((prev) => ({ ...prev, location: place.description }));
    setSelectedCoordinates({ lat: 35.6762, lng: 139.6503 });
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
        const targetEntry = entries[editIndex];
        if (!targetEntry) {
          throw new Error("編集対象のエントリが見つかりませんでした");
        }

        const response = await fetch(
          `${apiBaseUrl}/api/travel/${targetEntry.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(entryData),
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        await fetchEntries(searchParams ?? undefined);
      } else {
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
        await fetchEntries(searchParams ?? undefined);
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
    setNewEntry(emptyEntry);
    setEditMode(false);
    setEditIndex(null);
    setSelectedCoordinates(null);
  };

  const handleEditEntry = (index: number) => {
    const entry = entries[index];
    if (!entry) {
      return;
    }

    setEditMode(true);
    setEditIndex(index);
    setNewEntry({
      title: entry.title ?? "",
      date: entry.date ?? "",
      location: entry.location ?? "",
      notes: entry.notes ?? "",
      image: entry.image ?? null,
    });
    setSelectedCoordinates(null);
  };

  const handleDeleteEntry = async (index: number) => {
    if (window.confirm("このエントリを削除してもよろしいですか？")) {
      const entry = entries[index];
      if (!entry) {
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/travel/${entry.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (editMode && editIndex === index) {
          resetForm();
        }

        await fetchEntries(searchParams ?? undefined);
      } catch (error) {
        console.error("Error deleting entry:", error);
        alert(
          `エントリの削除に失敗しました。\n詳細: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  };

  const handleClearAllEntries = async () => {
    if (entries.length === 0) {
      alert("削除できるエントリがありません。");
      return;
    }

    const confirmed = window.confirm(
      `保存されている ${entries.length} 件のエントリをすべて削除しますか？`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/travel`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      resetForm();
      setEntries([]);
    } catch (error) {
      console.error("Error clearing all entries:", error);
      alert(
        `すべてのエントリの削除に失敗しました。\n詳細: ${error instanceof Error ? error.message : String(error)}`,
      );
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
              <div className="mb-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleClearAllEntries}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={entries.length === 0 || isSubmitting}
                >
                  すべて削除
                </button>
              </div>
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
