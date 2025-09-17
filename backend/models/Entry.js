const mongoose = require("mongoose");

const entrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  memo: { type: String },
  imageURL: { type: String },
  // タグ機能用
  tags: [{ type: String }],
  // 地図連携用
  latitude: { type: Number },
  longitude: { type: Number },
  // コメント機能用
  comments: [{
    commentText: String,
    author: String,
    timestamp: { type: Date, default: Date.now }
  }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = mongoose.model("Entry", entrySchema);