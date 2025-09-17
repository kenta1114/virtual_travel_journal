const express = require("express");
const router = express.Router();
const { Entry } = require("../models/index");
const { Op } = require("sequelize");

// エントリー全取得API
router.get("/", async (req, res) => {
  try {
    const entries = await Entry.findAll();
    res.json(entries);
  } catch (err) {
    console.error("エントリー取得エラー:", err);
    res.status(500).json({ error: "エントリーの取得に失敗しました" });
  }
});

// エントリー作成API
router.post("/", async (req, res) => {
  try {
    const { title, location, date, memo, imageURL, latitude, longitude } = req.body;
    // 必須項目チェック
    if (!title || !location || !date) {
      return res.status(400).json({ error: "タイトル・場所・日付は必須です" });
    }
    const entry = await Entry.create({
      title,
      location,
      date,
      memo,
      imageURL,
      latitude,
      longitude,
      UserId: null // 外部キー制約エラー回避のためnullに設定
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error("エントリー作成エラー:", err);
    res.status(500).json({ error: "エントリーの作成に失敗しました", details: err.message });
  }
});

// 検索・フィルターAPI
router.get("/search", async (req, res) => {
  try {
    const { location, startDate, endDate, keyword } = req.query;
    let whereClause = {};
    
    if (location) whereClause.location = { [Op.iLike]: `%${location}%` };
    
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = new Date(startDate);
      if (endDate) whereClause.date[Op.lte] = new Date(endDate);
    }
    
    if (keyword) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${keyword}%` } },
        { memo: { [Op.iLike]: `%${keyword}%` } }
      ];
    }
    
    const entries = await Entry.findAll({ where: whereClause });
    res.json(entries);
  } catch (err) {
    console.error("検索エラー:", err);
    res.status(500).json({ error: "検索に失敗しました" });
  }
});

module.exports = router;