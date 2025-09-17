const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, '.env') });

const app = express();

//Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // 画像データ対応のため50MBに増加
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// MIMEタイプの設定
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// Import models and sequelize instance
const { sequelize, User, Entry, Tag, Comment } = require("./models/index");

// Sync database
async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL');
    
    // Check available models
    console.log('Available models before sync:', Object.keys(sequelize.models));
    
    // Sync database tables (create if not exist)
    await sequelize.sync({ alter: true });
    console.log('Database synced - Tables are ready');
    
    // Verify models after sync
    console.log('Models after sync:', Object.keys(sequelize.models));
  } catch (error) {
    console.error('Database sync failed:', error);
  }
}

syncDatabase();

//Routes

const authRoutes = require("./routes/auth");
const travelRoutes = require("./routes/travel");

app.use("/api/auth",authRoutes);
app.use("/api/travel",travelRoutes);

//サーバー起動
const PORT = process.env.PORT || 5001;
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));