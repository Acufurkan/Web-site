const mongoose = require('mongoose');

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ad soyad gereklidir'],
    trim: true,
    maxlength: [100, 'Ad soyad 100 karakterden fazla olamaz']
  },
  email: {
    type: String,
    required: [true, 'E-posta gereklidir'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Geçerli bir e-posta adresi girin']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Telefon numarası 20 karakterden fazla olamaz']
  },
  subject: {
    type: String,
    required: [true, 'Konu gereklidir'],
    trim: true,
    maxlength: [200, 'Konu 200 karakterden fazla olamaz']
  },
  message: {
    type: String,
    required: [true, 'Mesaj gereklidir'],
    trim: true,
    maxlength: [1000, 'Mesaj 1000 karakterden fazla olamaz']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new'
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı gereklidir'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Ürün açıklaması gereklidir'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Kategori gereklidir'],
    enum: ['pencere', 'kapı', 'cephe', 'panjur', 'diğer']
  },
  features: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    min: [0, 'Fiyat negatif olamaz']
  },
  images: [{
    url: String,
    alt: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  specifications: {
    material: String,
    dimensions: String,
    weight: String,
    warranty: String
  }
}, {
  timestamps: true
});

// Admin User Schema
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Kullanıcı adı gereklidir'],
    unique: true,
    trim: true,
    minlength: [3, 'Kullanıcı adı en az 3 karakter olmalı']
  },
  email: {
    type: String,
    required: [true, 'E-posta gereklidir'],
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Şifre gereklidir'],
    minlength: [6, 'Şifre en az 6 karakter olmalı']
  },
  role: {
    type: String,
    enum: ['admin', 'moderator'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
contactSchema.index({ email: 1, createdAt: -1 });
contactSchema.index({ status: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for contact full info
contactSchema.virtual('fullInfo').get(function() {
  return `${this.name} (${this.email}) - ${this.subject}`;
});

// Pre-save middleware for admin password hashing
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const bcrypt = require('bcryptjs');
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(candidatePassword, this.password);
};

// Export models
const Contact = mongoose.model('Contact', contactSchema);
const Product = mongoose.model('Product', productSchema);
const Admin = mongoose.model('Admin', adminSchema);

module.exports = {
  Contact,
  Product,
  Admin
};
