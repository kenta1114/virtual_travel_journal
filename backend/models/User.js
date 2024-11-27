//認証機能の実装
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  username:{type:String,required:true,unique:true},
  password:{type:string,reuqired:true},
});

userSchema.pre("save",async function(next){
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.bash(this.password,10);
  next();
});

userScema.methods.comparePassword = async function(password){
  return bcrypt.compare(password,this.password);
};

module.exports = mongoose.model("User",userSchema);