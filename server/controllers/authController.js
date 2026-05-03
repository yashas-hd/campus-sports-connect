const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, college } = req.body;

    if (!email.endsWith(".edu")) {
      return res.status(400).json({ message: "Only college email allowed" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("OTP:", otp);
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    const user = await User.create({
      name,
      email,
      password,
      college,
      otp,
      otpExpires,
      otpAttempts: 0,
    });

    // Send OTP via email
    try {
      const message = `Your OTP for Campus Sports Connect registration is: ${otp}. It is valid for 10 minutes.`;
      await sendEmail({
        email: user.email,
        subject: 'Campus Sports Connect - Registration OTP',
        message,
      });
      res.status(201).json({
        message: 'User registered. Please check your email for OTP.',
        userId: user._id,
        otp: otp,
      });
    } catch (error) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp +otpExpires +otpAttempts');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (user.otpAttempts >= 5) {
      return res.status(403).json({ message: "Too many attempts. Request new OTP." });
    }

    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    await user.save();

    res.json({
      message: "Login successful",
      _id: user._id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      token: generateToken(user._id, user.email),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;

    await user.save();

    res.status(200).json({
      message: "OTP sent successfully",
      otp: otp,
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User already verified' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Resent OTP:", newOtp);

    user.otp = newOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;
    await user.save();

    try {
      const message = `Your new OTP for Campus Sports Connect is: ${newOtp}. It is valid for 5 minutes.`;
      await sendEmail({
        email: user.email,
        subject: 'Campus Sports Connect - New OTP',
        message,
      });
      res.json({
        message: 'OTP resent successfully',
        otp: newOtp
      });
    } catch (error) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  resendOTP,
};
