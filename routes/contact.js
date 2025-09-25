const express = require('express');
const { body, validationResult } = require('express-validator');
const { Contact } = require('../models');
const nodemailer = require('nodemailer');

const router = express.Router();

// Email transporter configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Validation middleware
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Ad soyad 2-100 karakter arasında olmalı'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Geçerli bir e-posta adresi girin'),
  body('phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Telefon numarası 20 karakterden fazla olamaz'),
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Konu 5-200 karakter arasında olmalı'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Mesaj 10-1000 karakter arasında olmalı')
];

// POST /api/contact - Yeni iletişim mesajı
router.post('/', contactValidation, async (req, res) => {
  try {
    // Validation errors check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Create new contact
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message,
      ipAddress,
      userAgent
    });

    await contact.save();

    // Send email notification
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `Yeni İletişim Mesajı: ${subject}`,
        html: `
          <h2>Yeni İletişim Mesajı</h2>
          <p><strong>Ad Soyad:</strong> ${name}</p>
          <p><strong>E-posta:</strong> ${email}</p>
          <p><strong>Telefon:</strong> ${phone || 'Belirtilmemiş'}</p>
          <p><strong>Konu:</strong> ${subject}</p>
          <p><strong>Mesaj:</strong></p>
          <p>${message}</p>
          <hr>
          <p><small>IP: ${ipAddress} | Tarih: ${new Date().toLocaleString('tr-TR')}</small></p>
        `
      });
    } catch (emailError) {
      console.error('Email gönderme hatası:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Mesajınız başarıyla gönderildi',
      data: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj gönderilirken bir hata oluştu'
    });
  }
});

// GET /api/contact - İletişim mesajlarını listele (Admin)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-ipAddress -userAgent');

    const total = await Contact.countDocuments(filter);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error('Contact fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesajlar getirilirken bir hata oluştu'
    });
  }
});

// GET /api/contact/:id - Tek mesaj detayı
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    res.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Contact fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj getirilirken bir hata oluştu'
    });
  }
});

// PUT /api/contact/:id/status - Mesaj durumunu güncelle
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Durum güncellendi',
      data: contact
    });

  } catch (error) {
    console.error('Contact update error:', error);
    res.status(500).json({
      success: false,
      message: 'Durum güncellenirken bir hata oluştu'
    });
  }
});

// DELETE /api/contact/:id - Mesajı sil
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Mesaj bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Mesaj silindi'
    });

  } catch (error) {
    console.error('Contact delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Mesaj silinirken bir hata oluştu'
    });
  }
});

module.exports = router;
