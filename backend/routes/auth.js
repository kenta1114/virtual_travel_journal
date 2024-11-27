const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../modesl/User");
const router = express.Router();

//サインアップ
router.post("/signup",async(req,res)=>{
  try{
    const {username,password} = req.body;
    const newUser = new User({username,password});
    await newUser.save();
    res.status(201).json({message:"User created successfully"});
  }catch(err){
    res.status(400).json({error:"Error creating user"});
  }
});

//ログイン
router.post("/login",async(req,res)=>{
  try{
    const {username,password}=req.body;
    const user = await User.findOne({username});
    if(!user || !(await user.comparePassword(password))){
      return res.status(401).json({error:"Invalid credentials"});
    }

    const token = jwt.sign({id:user._id},process.env.JWT__SECRET,{expiresIn:"1h"});
    res.status(200).json({token});
  }catch(err){
    res.status(400).json({error:"Error logging in"});
  }
});

module.exports=router;