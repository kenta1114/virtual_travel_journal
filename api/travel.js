let mockEntries = [
  {
    id: 1,
    title: "東京旅行",
    date: "2024-01-15",
    location: "東京都",
    memo: "スカイツリーを見学しました",
    imageURL: null,
    latitude: 35.6762,
    longitude: 139.6503,
  },
  {
    id: 2,
    title: "大阪グルメツアー",
    date: "2024-02-10",
    location: "大阪府",
    memo: "たこ焼きとお好み焼きを食べました",
    imageURL: null,
    latitude: 34.6937,
    longitude: 135.5023,
  },
];

export default async function handler(req, res) {
  // CORS設定
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === "GET") {
      const { keyword, location, startDate, endDate } = req.query;

      let filteredEntries = mockEntries;

      // 検索フィルター適用
      if (keyword) {
        filteredEntries = filteredEntries.filter(
          (entry) =>
            entry.title.includes(keyword) || entry.memo.includes(keyword),
        );
      }

      if (location) {
        filteredEntries = filteredEntries.filter((entry) =>
          entry.location.includes(location),
        );
      }

      if (startDate) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.date >= startDate,
        );
      }

      if (endDate) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.date <= endDate,
        );
      }

      res.status(200).json(filteredEntries);
    } else if (req.method === "POST") {
      // エントリ作成（モックデータに追加）
      const newEntry = {
        id: Date.now(),
        ...req.body,
        created_at: new Date().toISOString(),
      };

      res.status(201).json(newEntry);
    } else if (req.method === "PUT") {
      const id = Number(req.query.id || req.body.id);
      const nextEntry = {
        id,
        ...req.body,
        created_at: new Date().toISOString(),
      };

      mockEntries = mockEntries.map((entry) =>
        entry.id === id ? nextEntry : entry,
      );

      res.status(200).json(nextEntry);
    } else if (req.method === "DELETE") {
      const id = req.query.id || req.body?.id;
      if (id) {
        const numericId = Number(id);
        mockEntries = mockEntries.filter((entry) => entry.id !== numericId);
        res.status(200).json({ message: 'Entry deleted successfully' });
      } else {
        mockEntries = [];
        res.status(200).json({ message: 'All entries deleted successfully' });
      }
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
