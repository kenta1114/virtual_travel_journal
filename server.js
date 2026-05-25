import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Ensure uploads directory exists and serve it statically
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// データベース初期化
const db = new sqlite3.Database("./travel_journal.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");

    // テーブル作成
    db.run(`CREATE TABLE IF NOT EXISTS travel_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      memo TEXT,
      imageURL TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// 全エントリ取得
app.get("/api/travel", (req, res) => {
  db.all("SELECT * FROM travel_entries ORDER BY date DESC", (err, rows) => {
    if (err) {
      console.error("Error fetching entries:", err);
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.json(rows);
    }
  });
});

// エントリ作成
app.post("/api/travel", (req, res) => {
  const { title, date, location, memo, imageURL, latitude, longitude } =
    req.body;
  console.log(
    `POST /api/travel received: title=${title} date=${date} location=${location} at ${new Date().toISOString()}`,
  );

  if (!title || !date || !location) {
    return res
      .status(400)
      .json({ error: "Title, date, and location are required" });
  }

  // Prevent rapid duplicate submissions: check for recent identical entry
  const duplicateCheckSql = `SELECT * FROM travel_entries WHERE title = ? AND date = ? AND location = ? AND datetime(created_at) >= datetime('now','-10 seconds') ORDER BY created_at DESC LIMIT 1`;
  db.get(duplicateCheckSql, [title, date, location], (err, row) => {
    if (err) {
      console.error("Error checking duplicate entry:", err);
      // proceed with insertion to avoid false negatives
    }
    if (row) {
      // Found a recent duplicate - return existing entry instead of inserting
      return res.status(200).json(row);
    }

    // No recent duplicate - proceed to insert
    const sql = `INSERT INTO travel_entries (title, date, location, memo, imageURL, latitude, longitude) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(
      sql,
      [title, date, location, memo, imageURL, latitude, longitude],
      function (err) {
        if (err) {
          console.error("Error creating entry:", err);
          res.status(500).json({ error: "Error saving entry" });
        } else {
          res.status(201).json({
            id: this.lastID,
            title,
            date,
            location,
            memo,
            imageURL,
            latitude,
            longitude,
          });
        }
      },
    );
  });
});

// エントリ更新
app.put("/api/travel/:id", (req, res) => {
  const { id } = req.params;
  const { title, date, location, memo, imageURL, latitude, longitude } =
    req.body;

  if (!title || !date || !location) {
    return res
      .status(400)
      .json({ error: "Title, date, and location are required" });
  }

  const sql = `UPDATE travel_entries
               SET title = ?, date = ?, location = ?, memo = ?, imageURL = ?, latitude = ?, longitude = ?
               WHERE id = ?`;

  db.run(
    sql,
    [title, date, location, memo, imageURL, latitude, longitude, id],
    function (err) {
      if (err) {
        console.error("Error updating entry:", err);
        return res.status(500).json({ error: "Error updating entry" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Entry not found" });
      }

      db.get(
        "SELECT * FROM travel_entries WHERE id = ?",
        [id],
        (selectErr, row) => {
          if (selectErr) {
            console.error("Error fetching updated entry:", selectErr);
            return res
              .status(500)
              .json({ error: "Error fetching updated entry" });
          }

          res.json(row);
        },
      );
    },
  );
});

// エントリ検索
app.get("/api/travel/search", (req, res) => {
  const { keyword, location, startDate, endDate } = req.query;

  let sql = "SELECT * FROM travel_entries WHERE 1=1";
  const params = [];

  if (keyword) {
    sql += " AND (title LIKE ? OR memo LIKE ?)";
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (location) {
    sql += " AND location LIKE ?";
    params.push(`%${location}%`);
  }

  if (startDate) {
    sql += " AND date >= ?";
    params.push(startDate);
  }

  if (endDate) {
    sql += " AND date <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY date DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error("Error searching entries:", err);
      res.status(500).json({ error: "Search failed" });
    } else {
      res.json(rows);
    }
  });
});

// エントリ削除
app.delete("/api/travel", (req, res) => {
  db.run("DELETE FROM travel_entries", [], function (err) {
    if (err) {
      console.error("Error deleting all entries:", err);
      res.status(500).json({ error: "Error deleting entries" });
    } else {
      res.json({
        message: "All entries deleted successfully",
        deleted: this.changes,
      });
    }
  });
});

app.delete("/api/travel/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM travel_entries WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Error deleting entry:", err);
      res.status(500).json({ error: "Error deleting entry" });
    } else if (this.changes === 0) {
      res.status(404).json({ error: "Entry not found" });
    } else {
      res.json({ message: "Entry deleted successfully" });
    }
  });
});

// Local image upload endpoint for development: accepts a data URL and writes
// it to the local `uploads/` directory, returning a URL that the frontend
// can use to display the image.
app.post("/api/upload-image", (req, res) => {
  const { dataUrl } = req.body;
  if (!dataUrl || typeof dataUrl !== "string") {
    return res.status(400).json({ error: "Missing dataUrl" });
  }

  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    return res.status(400).json({ error: "Invalid dataUrl" });
  }

  const mime = matches[1];
  const base64Data = matches[2];
  const ext = mime.split("/")[1] === "jpeg" ? "jpg" : mime.split("/")[1];
  const filename = `journal-${Date.now()}.${ext}`;
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(base64Data, "base64");

  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error("Error writing uploaded image:", err);
      return res.status(500).json({ error: "Failed to save image" });
    }

    const publicUrl = `${req.protocol}://${req.get("host")}/uploads/${filename}`;
    res.status(201).json({ url: publicUrl });
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log("Database connection closed");
    process.exit(0);
  });
});
