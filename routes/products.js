const express = require('express');
const { body, validationResult } = require('express-validator');
const { Product } = require('../models');

const router = express.Router();

// Validation middleware
const productValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Ürün adı 3-100 karakter arasında olmalı'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Açıklama 10-1000 karakter arasında olmalı'),
  body('category')
    .isIn(['pencere', 'kapı', 'cephe', 'panjur', 'diğer'])
    .withMessage('Geçerli bir kategori seçin'),
  body('price')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Fiyat pozitif bir sayı olmalı')
];

// GET /api/products - Tüm ürünleri listele
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const category = req.query.category;
    const search = req.query.search;
    const activeOnly = req.query.active !== 'false';

    const filter = {};
    if (category) filter.category = category;
    if (activeOnly) filter.isActive = true;
    if (search) {
      filter.$text = { $search: search };
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total: total
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürünler getirilirken bir hata oluştu'
    });
  }
});

// GET /api/products/categories - Kategorileri listele
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Kategoriler getirilirken bir hata oluştu'
    });
  }
});

// GET /api/products/:id - Tek ürün detayı
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Product fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün getirilirken bir hata oluştu'
    });
  }
});

// POST /api/products - Yeni ürün oluştur (Admin)
router.post('/', productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Ürün başarıyla oluşturuldu',
      data: product
    });

  } catch (error) {
    console.error('Product creation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu ürün adı zaten kullanılıyor'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ürün oluşturulurken bir hata oluştu'
    });
  }
});

// PUT /api/products/:id - Ürün güncelle (Admin)
router.put('/:id', productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validasyon hatası',
        errors: errors.array()
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Ürün başarıyla güncellendi',
      data: product
    });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün güncellenirken bir hata oluştu'
    });
  }
});

// DELETE /api/products/:id - Ürün sil (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Ürün bulunamadı'
      });
    }

    res.json({
      success: true,
      message: 'Ürün silindi'
    });

  } catch (error) {
    console.error('Product delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Ürün silinirken bir hata oluştu'
    });
  }
});

module.exports = router;
