const { Sequelize, DataTypes } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(process.env.POSTGRES_URI, {
  dialect: "postgres",
});

// User
const User = sequelize.define("User", {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
});

// Entry
const Entry = sequelize.define("Entry", {
  title: { type: DataTypes.STRING(500), allowNull: false },
  location: { type: DataTypes.STRING(1000), allowNull: false },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  memo: { type: DataTypes.TEXT },
  imageURL: { type: DataTypes.TEXT },
  latitude: { type: DataTypes.FLOAT },
  longitude: { type: DataTypes.FLOAT },
});

// Tag
const Tag = sequelize.define("Tag", {
  name: { type: DataTypes.STRING(500), allowNull: false, unique: true },
});

// EntryTag (多対多)
const EntryTag = sequelize.define("EntryTag", {});
Entry.belongsToMany(Tag, { through: EntryTag });
Tag.belongsToMany(Entry, { through: EntryTag });

// Comment
const Comment = sequelize.define("Comment", {
  commentText: { type: DataTypes.TEXT, allowNull: false },
  author: { type: DataTypes.STRING(500) },
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});
Comment.belongsTo(Entry);
Entry.hasMany(Comment);

Entry.belongsTo(User);
User.hasMany(Entry);

module.exports = { sequelize, User, Entry, Tag, EntryTag, Comment };