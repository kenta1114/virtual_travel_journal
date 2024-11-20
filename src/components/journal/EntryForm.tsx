import { Camera } from 'lucide-react';
import { Entry, Place } from '../../types';

interface EntryFormProps {
  entry: Omit<Entry, 'id'>;
  editMode: boolean;
  suggestions: Place[];
  onEntryChange: (entry: Omit<Entry, 'id'>) => void;
  onLocationChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectLocation: (place: Place) => void;
  onImageUpload: (file: File) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EntryForm({
  entry,
  editMode,
  suggestions,
  onEntryChange,
  onLocationChange,
  onSelectLocation,
  onImageUpload,
  onSubmit,
}: EntryFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <input
          type="text"
          placeholder="タイトル"
          value={entry.title}
          onChange={(e) => onEntryChange({ ...entry, title: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2c5f2d] focus:border-transparent transition-all"
        />
        <input
          type="date"
          value={entry.date}
          onChange={(e) => onEntryChange({ ...entry, date: e.target.value })}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2c5f2d] focus:border-transparent transition-all"
        />
        <div className="relative">
          <input
            type="text"
            placeholder="場所"
            value={entry.location}
            onChange={onLocationChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2c5f2d] focus:border-transparent transition-all"
          />
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100">
              {suggestions.map((place) => (
                <div
                  key={place.place_id}
                  onClick={() => onSelectLocation(place)}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {place.description}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            onChange={(e) => e.target.files && onImageUpload(e.target.files[0])}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className="flex items-center justify-center px-4 py-3 rounded-lg border border-[#2c5f2d] text-[#2c5f2d] hover:bg-[#f0f9f0] cursor-pointer transition-colors"
          >
            <Camera className="w-5 h-5 mr-2" />
            写真を選択
          </label>
          {entry.image && (
            <div className="mt-2">
              <img
                src={entry.image}
                alt="プレビュー"
                className="w-full h-32 object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
      <textarea
        placeholder="メモ"
        value={entry.notes}
        onChange={(e) => onEntryChange({ ...entry, notes: e.target.value })}
        className="w-full px-4 py-3 h-32 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#2c5f2d] focus:border-transparent transition-all"
      />
      <button
        type="submit"
        className="w-full md:w-auto px-8 py-3 bg-[#2c5f2d] text-white rounded-lg hover:bg-[#234a24] transition-colors flex items-center justify-center gap-2"
      >
        {editMode ? "更新" : "追加"}
      </button>
    </form>
  );
}
