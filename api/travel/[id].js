let mockEntries = [];

export default async function handler(req, res) {
  // CORS設定
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    const { id } = req.query;

    if (req.method === "PUT") {
      const numericId = Number(id);
      const nextEntry = {
        id: numericId,
        ...req.body,
        created_at: new Date().toISOString(),
      };

      mockEntries = mockEntries.map((entry) =>
        entry.id === numericId ? nextEntry : entry,
      );

      res.status(200).json(nextEntry);
    } else if (req.method === "DELETE") {
      const numericId = Number(id);
      mockEntries = mockEntries.filter((entry) => entry.id !== numericId);
      res.status(200).json({ message: "Entry deleted successfully" });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
