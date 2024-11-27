const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

//Middleware
app.use(cors());
app.use(bodyParser.json());

//Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true 
})
.then(()=>console.log("Connected to MongoDB"))
.catch((err)=>console.error("MongoDB connection error", err));

//Routes
const authRoutes = require("./routes/auth");
const travelRoutes = require("./routes/travel");

app.use("/api/auth",authRoutes);
app.use("/api/travel",travelRoutes);

//サーバー起動
const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));