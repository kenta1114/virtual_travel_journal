import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// データベース初期化
const db = new sqlite3.Database('./travel_journal.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
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
app.get('/api/travel', (req, res) => {
  db.all('SELECT * FROM travel_entries ORDER BY date DESC', (err, rows) => {
    if (err) {
      console.error('Error fetching entries:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(rows);
    }
  });
});

// エントリ作成
app.post('/api/travel', (req, res) => {
  const { title, date, location, memo, imageURL, latitude, longitude } = req.body;
  
  if (!title || !date || !location) {
    return res.status(400).json({ error: 'Title, date, and location are required' });
  }

  const sql = `INSERT INTO travel_entries (title, date, location, memo, imageURL, latitude, longitude) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [title, date, location, memo, imageURL, latitude, longitude], function(err) {
    if (err) {
      console.error('Error creating entry:', err);
      res.status(500).json({ error: 'Error saving entry' });
    } else {
      res.status(201).json({
        id: this.lastID,
        title,
        date,
        location,
        memo,
        imageURL,
        latitude,
        longitude
      });
    }
  });
});

// エントリ検索
app.get('/api/travel/search', (req, res) => {
  const { keyword, location, startDate, endDate } = req.query;
  
  let sql = 'SELECT * FROM travel_entries WHERE 1=1';
  const params = [];
  
  if (keyword) {
    sql += ' AND (title LIKE ? OR memo LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (location) {
    sql += ' AND location LIKE ?';
    params.push(`%${location}%`);
  }
  
  if (startDate) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }
  
  sql += ' ORDER BY date DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error searching entries:', err);
      res.status(500).json({ error: 'Search failed' });
    } else {
      res.json(rows);
    }
  });
});

// エントリ削除
app.delete('/api/travel/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM travel_entries WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting entry:', err);
      res.status(500).json({ error: 'Error deleting entry' });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Entry not found' });
    } else {
      res.json({ message: 'Entry deleted successfully' });
    }
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed');
    process.exit(0);
  });
});