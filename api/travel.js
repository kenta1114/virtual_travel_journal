
let mockEntries = [];

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
