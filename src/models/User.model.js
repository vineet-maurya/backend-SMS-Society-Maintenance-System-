const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    societyName: {
      type: String,
      trim: true,
      default: 'Royal Avenue',
    },
    houseNo: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^\d{10}$/, 'Phone number must be a 10 digit number'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default in queries
    },
    // 'user'  -> normal resident account
    // 'admin' -> society administrator
    // Set at signup from the role chosen on the pre-signup role-selection
    // page ("Resident User" / "Admin User"), validated against this enum
    // in auth.controller.js's signup handler (falls back to 'user' if
    // missing/invalid). Signup caps self-service admin creation at one
    // account — see the admin-already-exists check in that handler.
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

// Instance method: compares a plaintext password against the stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Never leak the hash even if a document is accidentally serialized
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);