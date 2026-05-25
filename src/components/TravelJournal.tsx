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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_UPLOAD_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB input limit
const MAX_OUTPUT_IMAGE_SIZE_BYTES = 700 * 1024; // approx payload-safe target
const IMAGE_MAX_WIDTH = 1280;
const IMAGE_MAX_HEIGHT = 1280;
const IMAGE_UPLOAD_URL = import.meta.env.VITE_IMAGE_UPLOAD_URL as
  | string
  | undefined;
const IMAGE_UPLOAD_PRESET = import.meta.env.VITE_IMAGE_UPLOAD_PRESET as
  | string
  | undefined;

const dataUrlSizeBytes = (dataUrl: string): number => {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.ceil((base64.length * 3) / 4);
};

const canvasToDataUrl = (
  canvas: HTMLCanvasElement,
  quality: number,
): string => {
  return canvas.toDataURL("image/jpeg", quality);
};

const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const uploadImageToStorage = async (
  imageDataUrl: string,
): Promise<string | null> => {
  // Configure VITE_IMAGE_UPLOAD_URL (+ VITE_IMAGE_UPLOAD_PRESET for Cloudinary unsigned uploads)
  // to enable URL-based image storage. Without it, we skip image upload to avoid 413.
  if (!IMAGE_UPLOAD_URL) {
    return null;
  }

  const blob = await dataUrlToBlob(imageDataUrl);
  const extension = blob.type.includes("png") ? "png" : "jpg";
  const file = new File([blob], `journal-${Date.now()}.${extension}`, {
    type: blob.type || "image/jpeg",
  });

  const formData = new FormData();
  formData.append("file", file);
  if (IMAGE_UPLOAD_PRESET) {
    formData.append("upload_preset", IMAGE_UPLOAD_PRESET);
  }

  const response = await fetch(IMAGE_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image upload failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  const uploadedUrl = payload.secure_url || payload.url;
  if (!uploadedUrl) {
    throw new Error("Image upload response did not contain an URL");
  }

  return uploadedUrl;
};

const compressImageFile = async (
  file: File,
  quality: number,
  maxWidth: number,
  maxHeight: number,
): Promise<string> => {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height, 1);

  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvasToDataUrl(canvas, quality);
};

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
    (file: File): Promise<void>;
  }

  const handleImageUpload: ImageUploadHandler = useCallback(
    async (file: File) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert("JPEG / PNG / WebP の画像のみ対応しています。");
        return;
      }

      if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
        alert("画像サイズが大きすぎます。8MB以下の画像を選択してください。");
        return;
      }

      try {
        let compressedDataUrl = await compressImageFile(
          file,
          0.78,
          IMAGE_MAX_WIDTH,
          IMAGE_MAX_HEIGHT,
        );

        if (dataUrlSizeBytes(compressedDataUrl) > MAX_OUTPUT_IMAGE_SIZE_BYTES) {
          compressedDataUrl = await compressImageFile(file, 0.62, 960, 960);
        }

        if (dataUrlSizeBytes(compressedDataUrl) > MAX_OUTPUT_IMAGE_SIZE_BYTES) {
          alert(
            "画像を圧縮しても送信サイズ上限を超えています。より小さい画像を選択してください。",
          );
          return;
        }

        setNewEntry((prev) => ({ ...prev, image: compressedDataUrl }));
      } catch (error) {
        console.error("Image compression failed:", error);
        alert("画像の処理に失敗しました。別の画像をお試しください。");
      }
    },
    [],
  );

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

      let uploadedImageUrl: string | null = null;
      if (newEntry.image) {
        if (
          newEntry.image.startsWith("http://") ||
          newEntry.image.startsWith("https://")
        ) {
          uploadedImageUrl = newEntry.image;
        } else {
          try {
            if (IMAGE_UPLOAD_URL) {
              uploadedImageUrl = await uploadImageToStorage(newEntry.image);
              if (!uploadedImageUrl) {
                console.warn(
                  "Image upload returned no URL. Entry will be saved without image.",
                );
              }
            } else {
              // No external upload configured — try local server upload shim
              try {
                const resp = await fetch(`${apiBaseUrl}/api/upload-image`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ dataUrl: newEntry.image }),
                });

                if (!resp.ok) {
                  console.warn(
                    "Local image upload failed, saving entry without image",
                    resp.status,
                  );
                } else {
                  const json = await resp.json();
                  uploadedImageUrl = json.url || json.imageURL || null;
                }
              } catch (localUploadErr) {
                console.error("Local image upload failed:", localUploadErr);
                // fall back to saving without image
              }
            }
          } catch (uploadError) {
            console.error("Image upload failed:", uploadError);
            alert(
              "画像アップロードに失敗しました。画像なしで保存する場合はそのまま再投稿してください。",
            );
            return;
          }
        }
      }

      const entryData = {
        title: newEntry.title,
        date: newEntry.date,
        location: newEntry.location,
        memo: newEntry.notes,
        imageURL: uploadedImageUrl,
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
      const deleteResults = await Promise.all(
        entries.map(async (entry) => {
          const response = await fetch(`${apiBaseUrl}/api/travel/${entry.id}`, {
            method: "DELETE",
          });

          if (!response.ok && response.status !== 404) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response;
        }),
      );

      const hadOnlyNotFoundResponses = deleteResults.every(
        (response) => response.ok || response.status === 404,
      );

      if (!hadOnlyNotFoundResponses) {
        throw new Error("一部のエントリを削除できませんでした。");
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
