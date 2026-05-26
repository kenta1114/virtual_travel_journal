export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PUT,DELETE",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "PUT" && req.method !== "DELETE" && req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const id = Number(req.query.id);

  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid entry id" });
    return;
  }

  try {
    if (req.method === "GET") {
      return res.status(200).json({
        id,
        title: "",
        date: "",
        location: "",
        memo: "",
        imageURL: null,
      });
    }

    if (req.method === "PUT") {
      const nextEntry = {
        id,
        ...req.body,
        created_at: new Date().toISOString(),
      };

      return res.status(200).json(nextEntry);
    }

    return res.status(200).json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("API travel/[id] error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}