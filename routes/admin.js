const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { Admin, Contact, Product } = require('../models');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Erişim token\'ı gerekli'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Geçersiz token'
      });
    }
    req.user = user;
    next();
  });
};

// POST /api/admin/login - Admin girişi
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Kullanıcı adı gerekli'),
  body('password').notEmpty().withMessage('Şifre gerekli')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find admin user
    const admin = await Admin.findOne({ 
      $or: [{ username }, { email: username }],
      isActive: true 
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Check password
    const isValidPassword = await admin.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        username: admin.username, 
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı',
      data: {
        token,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          lastLogin: admin.lastLogin
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Giriş yapılırken bir hata oluştu'
    });
  }
});

// GET /api/admin/dashboard - Dashboard istatistikleri
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const [
      totalContacts,
      newContacts,
      totalProducts,
      activeProducts
    ] = await Promise.all([
      Contact.countDocuments(),
      Contact.countDocuments({ status: 'new' }),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true })
    ]);

    // Recent contacts
    const recentContacts = await Contact.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subject status createdAt');

    // Contact status distribution
    const contactStats = await Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalContacts,
          newContacts,
          totalProducts,
          activeProducts
        },
        recentContacts,
        contactStats
      }
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Dashboard verileri getirilirken bir hata oluştu'
    });
  }
});

// POST /api/admin/register - Yeni admin oluştur (Sadece admin)
router.post('/register', authenticateToken, [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Kullanıcı adı 3-50 karakter arasında olmalı'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Şifre en az 6 karakter olmalı'),
  body('role')
    .optional()
    .isIn(['admin', 'moderator'])
    .withMessage('Geçerli bir rol seçin')
], async (req, res) => {
  try {
    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için admin yetkisi gerekli'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { username, email, password, role = 'moderator' } = req.body;

    // Check if user already exists
    const existingUser = await Admin.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor'
      });
    }

    // Create new admin
    const admin = new Admin({
      username,
      email,
      password,
      role
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin kullanıcısı başarıyla oluşturuldu',
      data: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin oluşturulurken bir hata oluştu'
    });
  }
});

// GET /api/admin/profile - Profil bilgileri
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id)
      .select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil bilgileri getirilirken bir hata oluştu'
    });
  }
});

// PUT /api/admin/profile - Profil güncelle
router.put('/profile', authenticateToken, [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi girin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const updateData = {};
    
    if (email) updateData.email = email;

    const admin = await Admin.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profil başarıyla güncellendi',
      data: admin
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil güncellenirken bir hata oluştu'
    });
  }
});

module.exports = router;
