const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');
const { generateAccessToken, generateRefreshToken, verifyToken, generateResetToken } = require('../utils/tokenUtils');
const Logger = require('../utils/logger');
const emailService = require('../utils/emailService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    await Logger.logAuth('registration_failed', null, req, {
      email,
      reason: 'Email already exists',
      status: 'failure'
    });
    
    return res.status(400).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields'
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    address,
    status: role === 'admin' ? 'active' : 'pending'
  });

  // Log successful registration
  await Logger.logAuth('user_registered', user, req, {
    email: user.email,
    role: user.role,
    status: 'success'
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Check for user and include password
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    await Logger.logAuth('login_failed', null, req, {
      email,
      reason: 'User not found',
      status: 'failure'
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if account is locked
  if (user.isLocked) {
    await Logger.logAuth('login_failed', user, req, {
      email,
      reason: 'Account locked',
      status: 'failure'
    });
    
    return res.status(401).json({
      success: false,
      message: 'Account is locked due to multiple failed login attempts. Please try again later.'
    });
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Increment login attempts
    await user.incLoginAttempts();
    
    await Logger.logAuth('login_failed', user, req, {
      email,
      reason: 'Invalid password',
      loginAttempts: user.loginAttempts + 1,
      status: 'failure'
    });
    
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Check if user account is active
  if (user.status !== 'active') {
    await Logger.logAuth('login_failed', user, req, {
      email,
      reason: 'Account not active',
      accountStatus: user.status,
      status: 'failure'
    });
    
    return res.status(401).json({
      success: false,
      message: 'Account is not active. Please contact administrator.'
    });
  }

  // Reset login attempts and update last login
  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  await user.save();

  // Generate tokens
  const sessionId = require('crypto').randomBytes(16).toString('hex');
  const tokenPayload = {
    id: user._id,
    role: user.role,
    sessionId
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token
  user.refreshTokens.push({
    token: refreshToken,
    createdAt: new Date()
  });

  // Keep only last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();

  // Log successful login
  await Logger.logAuth('login_success', user, req, {
    email: user.email,
    role: user.role,
    sessionId,
    status: 'success'
  });

  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin
      },
      accessToken,
      expiresIn: process.env.JWT_EXPIRE || '15m'
    }
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken && req.user) {
    // Remove refresh token from user
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { refreshTokens: { token: refreshToken } }
    });
  }

  // Log logout
  await Logger.logAuth('logout', req.user, req, {
    sessionId: req.sessionId,
    status: 'success'
  });

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token not provided'
    });
  }

  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: user._id,
      role: user.role,
      sessionId: decoded.sessionId
    });

    // Log token refresh
    await Logger.logAuth('token_refreshed', user, req, {
      sessionId: decoded.sessionId,
      status: 'success'
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: process.env.JWT_EXPIRE || '15m'
      }
    });
  } catch (error) {
    await Logger.logAuth('token_refresh_failed', null, req, {
      reason: error.message,
      status: 'failure'
    });
    
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    await Logger.logAuth('password_reset_failed', null, req, {
      email,
      reason: 'User not found',
      status: 'failure'
    });
    
    // Still return success to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: 'If that email exists, a password reset link has been sent'
    });
  }

  // Generate reset token
  const { token, hashedToken, expire } = generateResetToken();

  // Save reset token to user
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = expire;
  await user.save();

  // Send email
  try {
    await emailService.sendPasswordReset(email, token, user.name);
    
    await Logger.logAuth('password_reset_requested', user, req, {
      email,
      status: 'success'
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await Logger.logAuth('password_reset_failed', user, req, {
      email,
      reason: 'Email sending failed',
      error: error.message,
      status: 'failure'
    });

    res.status(500).json({
      success: false,
      message: 'Email could not be sent'
    });
  }
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const resetToken = req.params.token;

  // Hash the token and find user
  const hashedToken = require('crypto').createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    await Logger.logAuth('password_reset_failed', null, req, {
      reason: 'Invalid or expired token',
      status: 'failure'
    });
    
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Set new password
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  
  // Clear all refresh tokens for security
  user.refreshTokens = [];
  
  await user.save();

  await Logger.logAuth('password_reset_success', user, req, {
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshTokens');

  res.status(200).json({
    success: true,
    data: { user }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'address', 'preferences'];
  const updates = {};

  // Filter allowed fields
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  ).select('-password -refreshTokens');

  await Logger.logAuth('profile_updated', user, req, {
    updatedFields: Object.keys(updates),
    status: 'success'
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user }
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    await Logger.logAuth('password_change_failed', user, req, {
      reason: 'Invalid current password',
      status: 'failure'
    });
    
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  
  // Clear all refresh tokens for security
  user.refreshTokens = [];
  
  await user.save();

  await Logger.logAuth('password_changed', user, req, {
    status: 'success'
  });

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.'
  });
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
};