const Product = require('../models/Product');

// @desc    Get all products (with search, filter & pagination)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;

    // Search by name
    const keyword = req.query.keyword
      ? { name: { $regex: req.query.keyword, $options: 'i' } }
      : {};

    // Filter by category
    const category = req.query.category ? { category: req.query.category } : {};

    // Filter by max price
    const priceFilter = req.query.maxPrice ? { price: { $lte: Number(req.query.maxPrice) } } : {};

    // Combine filters and exclude soft-deleted items
    const query = { ...keyword, ...category, ...priceFilter, isDeleted: false };

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
    if (product) {
      if (product.stock === 0) {
        // Frontend will use this field or stock === 0 to disable "Buy" logic
        product.status = 'Out of Stock';
      }
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const product = new Product({
      name: req.body.name || 'Sample name',
      price: req.body.price || 0,
      discountPrice: req.body.discountPrice || 0,
      category: req.body.category || 'Sample category',
      stock: req.body.stock || 0,
      images: req.body.images || [],
      description: req.body.description || 'Sample description',
      variants: req.body.variants || []
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && !product.isDeleted) {
      product.name = req.body.name || product.name;
      product.price = req.body.price || product.price;
      product.discountPrice = req.body.discountPrice ?? product.discountPrice;
      product.category = req.body.category || product.category;
      product.stock = req.body.stock ?? product.stock;
      product.images = req.body.images || product.images;
      product.description = req.body.description || product.description;
      product.variants = req.body.variants || product.variants;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product (Soft delete)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product && !product.isDeleted) {
      product.isDeleted = true; // Soft delete
      await product.save();
      res.json({ message: 'Product removed (soft delete)' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
