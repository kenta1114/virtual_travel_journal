import { useState, useEffect, useCallback } from 'react';
import { Header } from './Header';
import { EntryForm } from './Entry';
import { EntryList } from './EntryList';
import { User, Entry, Place } from '../../types';

interface JournalPageProps {
  user: User;
  onLogout: () => void;
}

export function JournalPage({ user, onLogout }: JournalPageProps) {
  const loadSavedEntries = () => {
    if (typeof window !== "undefined") {
      const savedEntries = localStorage.getItem("journalEntries");
      return savedEntries ? JSON.parse(savedEntries) : [];
    }
    return [];
  };

  const [entries, setEntries] = useState<Entry[]>(loadSavedEntries);
  const [newEntry, setNewEntry] = useState<Omit<Entry, 'id'>>({
    title: "",
    date: "",
    location: "",
    notes: "",
    image: null,
  });

  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<Place[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("journalEntries", JSON.stringify(entries));
    }
  }, [entries]);

  const handleLocationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEntry({ ...newEntry, location: value });

    if (value.length > 2) {
      const fakeSuggestions = [];
      setSuggestions(fakeSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectLocation = (place: Place) => {
    setNewEntry({ ...newEntry, location: place.description });
    setSuggestions([]);
  };

  const handleImageUpload = useCallback((file: File) => {
    const fakeUrl = URL.createObjectURL(file);
    setNewEntry((prev) => ({ ...prev, image: fakeUrl }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEntry.title || !newEntry.date || !newEntry.location) {
      alert("タイトル、日付、場所は必須項目です。");
      return;
    }

    if (editMode && editIndex !== null) {
      const updatedEntries = entries.map((entry, index) =>
        index === editIndex ? { ...newEntry, id: entry.id } : entry
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

  const handleEditEntry = (index: number) => {
    setEditMode(true);
    setEditIndex(index);
    setNewEntry(entries[index]);
  };

  const handleDeleteEntry = (index: number) => {
    if (window.confirm("このエントリを削除してもよろしいですか？")) {
      const updatedEntries = entries.filter((_, i) => i !== index);
      setEntries(updatedEntries);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f0] to-[#e6f3e6] p-6">
      <div className="max-w-6xl mx-auto">
        <Header user={user} onLogout={onLogout} />
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <EntryForm
            entry={newEntry}
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
