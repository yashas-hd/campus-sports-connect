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

    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail.endsWith(".edu")) {
      return res.status(400).json({ message: "Only college email allowed" });
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      college,
      otp,
      otpExpires,
      otpAttempts: 0,
    });

    // Send OTP via email
    try {
      const subject = 'Campus Sports Connect - Registration OTP';
      const message = `Your OTP for Campus Sports Connect registration is: ${otp}. It is valid for 5 minutes.`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #00f3ff; padding-bottom: 10px;">Campus Sports Connect</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">Thank you for registering. Please use the following One-Time Password (OTP) to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #00f3ff; background-color: #0f172a; padding: 12px 24px; border-radius: 6px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. If you did not request this code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated system email. Please do not reply.</p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject,
        message,
        html
      });

      return res.status(201).json({
        success: true,
        message: 'User registered successfully. OTP sent to your email.',
        userId: user._id,
      });
    } catch (error) {
      console.error("Email sending failed during registration:", error);
      // Clean up the created user record since registration could not complete
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send verification OTP email. Please check your email address and try again.' 
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: error.message 
    });
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

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (user.otpAttempts >= 5) {
      return res.status(403).json({ message: "Too many attempts. Request new OTP." });
    }

    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

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
    const { email, password } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;

    await user.save({ validateBeforeSave: false });

    // Send OTP via email
    try {
      const subject = 'Campus Sports Connect - Login OTP';
      const message = `Your OTP for Campus Sports Connect login is: ${otp}. It is valid for 5 minutes.`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #ff00ff; padding-bottom: 10px;">Campus Sports Connect</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">You are attempting to log in. Please use the following One-Time Password (OTP) to complete your login:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #ff00ff; background-color: #0f172a; padding: 12px 24px; border-radius: 6px; display: inline-block;">${otp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. If you did not request this login, please change your password immediately.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated system email. Please do not reply.</p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject,
        message,
        html
      });

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully. Please check your email.",
        userId: user._id
      });
    } catch (emailErr) {
      console.error("Email sending failed during login:", emailErr);
      // Revert OTP fields to avoid leaving user in semi-state
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: "Failed to send login OTP email. Please try again."
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = newOtp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    try {
      const subject = 'Campus Sports Connect - New OTP';
      const message = `Your new OTP for Campus Sports Connect is: ${newOtp}. It is valid for 5 minutes.`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #39ff14; padding-bottom: 10px;">Campus Sports Connect</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">You requested a new One-Time Password (OTP). Please use the following code:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 5px; color: #39ff14; background-color: #0f172a; padding: 12px 24px; border-radius: 6px; display: inline-block;">${newOtp}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. If you did not request a new code, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated system email. Please do not reply.</p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject,
        message,
        html
      });
      res.json({
        success: true,
        message: 'OTP resent successfully. Please check your email.'
      });
    } catch (error) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: 'Email could not be sent. Please try again.' });
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
