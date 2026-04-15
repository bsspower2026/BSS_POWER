import express from 'express';
import Part from '../models/Part.js';

const router = express.Router();

// Create part
router.post('/', async (req, res) => {
  try {
    const partData = req.body;
    
    // Map frontend fields to backend schema
    const newPart = new Part({
      partName: partData.name,
      partCode: partData.partNumber,
      category: partData.category,
      description: partData.description,
      quantityInStock: partData.quantity || 0,
      unitOfMeasurement: partData.unitOfMeasurement,
      minimumStockLevel: partData.minimumLevel || 0,
      reorderLevel: partData.reorderLevel || 0,
      costPrice: partData.costPrice || 0,
      sellingPrice: partData.sellingPrice || 0,
      supplier: partData.supplier,
      supplierPartNumber: partData.supplierPartNumber,
      supplierPhone: partData.supplierPhone,
      location: partData.location,
      warrantyMonths: partData.warrantyMonths,
      notes: partData.notes,
      photos: partData.photos || [],
      status: partData.quantity > 0 ? 'Available' : 'Out of Stock'
    });

    await newPart.save();
    
    res.status(201).json({
      success: true,
      message: 'Part created successfully',
      data: newPart
    });
  } catch (error) {
    console.error('Error creating part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create part',
      error: error.message
    });
  }
});

// Get all parts
router.get('/', async (req, res) => {
  try {
    const filter = {};

    // Search by name or code
    if (req.query.search) {
      filter.$or = [
        { partName: { $regex: req.query.search, $options: 'i' } },
        { partCode: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const parts = await Part.find(filter)
      .sort({ createdAt: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 100)
      .skip(req.query.skip ? parseInt(req.query.skip) : 0);

    // Format parts for frontend
    const formattedParts = parts.map(part => ({
      _id: part._id,
      name: part.partName,
      partNumber: part.partCode,
      category: part.category,
      description: part.description,
      quantity: part.quantityInStock,
      unitOfMeasurement: part.unitOfMeasurement,
      minimumLevel: part.minimumStockLevel,
      reorderLevel: part.reorderLevel,
      costPrice: part.costPrice,
      sellingPrice: part.sellingPrice,
      supplier: part.supplier,
      supplierPartNumber: part.supplierPartNumber,
      supplierPhone: part.supplierPhone,
      location: part.location,
      warrantyMonths: part.warrantyMonths,
      notes: part.notes,
      photos: part.photos || [],
      status: part.status
    }));
    
    res.status(200).json({
      success: true,
      data: formattedParts,
      total: parts.length
    });
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch parts',
      error: error.message
    });
  }
});

// Get part by ID
router.get('/:id', async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }
    
    // Map backend fields to frontend format
    const formattedPart = {
      _id: part._id,
      name: part.partName,
      partNumber: part.partCode,
      category: part.category,
      description: part.description,
      quantity: part.quantityInStock,
      unitOfMeasurement: part.unitOfMeasurement,
      minimumLevel: part.minimumStockLevel,
      reorderLevel: part.reorderLevel,
      costPrice: part.costPrice,
      sellingPrice: part.sellingPrice,
      supplier: part.supplier,
      supplierPartNumber: part.supplierPartNumber,
      supplierPhone: part.supplierPhone,
      location: part.location,
      warrantyMonths: part.warrantyMonths,
      notes: part.notes,
      photos: part.photos || []
    };
    
    res.status(200).json({
      success: true,
      data: formattedPart
    });
  } catch (error) {
    console.error('Error fetching part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch part',
      error: error.message
    });
  }
});

// Update part
router.put('/:id', async (req, res) => {
  try {
    const partData = req.body;
    
    // Map frontend fields to backend schema
    const updateData = {
      partName: partData.name,
      partCode: partData.partNumber,
      category: partData.category,
      description: partData.description,
      quantityInStock: partData.quantity || 0,
      unitOfMeasurement: partData.unitOfMeasurement,
      minimumStockLevel: partData.minimumLevel || 0,
      reorderLevel: partData.reorderLevel || 0,
      costPrice: partData.costPrice || 0,
      sellingPrice: partData.sellingPrice || 0,
      supplier: partData.supplier,
      supplierPartNumber: partData.supplierPartNumber,
      supplierPhone: partData.supplierPhone,
      location: partData.location,
      warrantyMonths: partData.warrantyMonths,
      notes: partData.notes,
      photos: partData.photos || [],
      status: partData.quantity > 0 ? 'Available' : 'Out of Stock',
      updatedAt: new Date()
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });
    
    const part = await Part.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Part updated successfully',
      data: part
    });
  } catch (error) {
    console.error('Error updating part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update part',
      error: error.message
    });
  }
});

// Delete part
router.delete('/:id', async (req, res) => {
  try {
    const part = await Part.findByIdAndDelete(req.params.id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Part deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting part:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete part',
      error: error.message
    });
  }
});

// Update stock (add or subtract)
router.post('/:id/update-stock', async (req, res) => {
  try {
    const { quantity, operation } = req.body;
    
    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Quantity and operation are required'
      });
    }
    
    const part = await Part.findById(req.params.id);
    
    if (!part) {
      return res.status(404).json({
        success: false,
        message: 'Part not found'
      });
    }
    
    if (operation === 'add') {
      part.quantityInStock += quantity;
    } else if (operation === 'subtract') {
      if (part.quantityInStock < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      part.quantityInStock -= quantity;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "subtract"'
      });
    }
    
    // Update status based on quantity
    if (part.quantityInStock === 0) {
      part.status = 'Out of Stock';
    } else {
      part.status = 'Available';
    }
    
    part.updatedAt = new Date();
    await part.save();
    
    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        quantity: part.quantityInStock,
        status: part.status
      }
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message
    });
  }
});

// Get low stock parts
router.get('/inventory/low-stock', async (req, res) => {
  try {
    const parts = await Part.find({
      $expr: { $lte: ['$quantityInStock', '$minimumStockLevel'] }
    }).sort({ quantityInStock: 1 });
    
    const formattedParts = parts.map(part => ({
      _id: part._id,
      name: part.partName,
      partNumber: part.partCode,
      quantity: part.quantityInStock,
      minimumLevel: part.minimumStockLevel,
      unitOfMeasurement: part.unitOfMeasurement,
      photos: part.photos || []
    }));
    
    res.status(200).json({
      success: true,
      data: formattedParts
    });
  } catch (error) {
    console.error('Error fetching low stock parts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock parts',
      error: error.message
    });
  }
});

// Get part statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalParts = await Part.countDocuments();
    const inStock = await Part.countDocuments({ 
      status: 'Available', 
      quantityInStock: { $gt: 0 } 
    });
    const lowStock = await Part.countDocuments({
      $expr: { $lte: ['$quantityInStock', '$minimumStockLevel'] },
      quantityInStock: { $gt: 0 }
    });
    const outOfStock = await Part.countDocuments({ 
      quantityInStock: 0 
    });
    
    res.status(200).json({
      success: true,
      stats: {
        total: totalParts,
        inStock,
        lowStock,
        outOfStock
      }
    });
  } catch (error) {
    console.error('Error fetching part stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;