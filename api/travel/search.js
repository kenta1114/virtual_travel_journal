export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keyword, location, startDate, endDate } = req.query;
    
    // モックデータ
    const mockEntries = [
      {
        id: 1,
        title: "東京旅行",
        date: "2024-01-15",
        location: "東京都",
        memo: "スカイツリーを見学しました",
        imageURL: null,
        latitude: 35.6762,
        longitude: 139.6503
      },
      {
        id: 2,
        title: "大阪グルメツアー",
        date: "2024-02-10",
        location: "大阪府",
        memo: "たこ焼きとお好み焼きを食べました",
        imageURL: null,
        latitude: 34.6937,
        longitude: 135.5023
      },
      {
        id: 3,
        title: "京都散策",
        date: "2024-03-05",
        location: "京都府",
        memo: "清水寺と金閣寺を訪問",
        imageURL: null,
        latitude: 35.0116,
        longitude: 135.7681
      }
    ];
    
    let filteredEntries = mockEntries;
    
    // 検索フィルター適用
    if (keyword) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.title.toLowerCase().includes(keyword.toLowerCase()) || 
        entry.memo.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    if (location) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    if (startDate) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.date >= startDate
      );
    }
    
    if (endDate) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.date <= endDate
      );
    }
    
    res.status(200).json(filteredEntries);
  } catch (error) {
    console.error('Search API Error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}