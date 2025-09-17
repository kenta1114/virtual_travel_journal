export async function getNearbySuggestions(location: { lat: number; lng: number }): Promise<string[]> {
  // ダミーのスポット提案
  return [
    "近くのレストラン",
    "観光スポット",
    "公園",
    "美術館",
    "ショッピングセンター"
  ];
}