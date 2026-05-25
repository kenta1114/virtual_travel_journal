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
    const mockEntries = [];

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