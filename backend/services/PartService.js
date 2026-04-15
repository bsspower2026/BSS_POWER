// backend/services/PartService.js

import Part from '../models/Part.js';

class PartService {
  async createPart(partData, userId) {
    try {
      const part = new Part({
        ...partData,
        createdBy: userId
      });

      await part.save();

      return {
        success: true,
        message: 'Part created successfully',
        part
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllParts(query = {}) {
    try {
      const filter = {};

      // Search by name or code
      if (query.search) {
        filter.$or = [
          { partName: { $regex: query.search, $options: 'i' } },
          { partCode: { $regex: query.search, $options: 'i' } }
        ];
      }

      // Filter by category
      if (query.category) {
        filter.category = query.category;
      }

      // Filter by status
      if (query.status) {
        filter.status = query.status;
      }

      const parts = await Part.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(query.limit ? parseInt(query.limit) : 100)
        .skip(query.skip ? parseInt(query.skip) : 0);

      const total = await Part.countDocuments(filter);

      return {
        success: true,
        parts,
        total,
        limit: query.limit ? parseInt(query.limit) : 100,
        skip: query.skip ? parseInt(query.skip) : 0
      };
    } catch (error) {
      throw error;
    }
  }

  async getPartById(partId) {
    try {
      const part = await Part.findById(partId)
        .populate('createdBy', 'name email');

      if (!part) {
        const error = new Error('Part not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        part
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePart(partId, updateData) {
    try {
      const part = await Part.findByIdAndUpdate(
        partId,
        {
          ...updateData,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email');

      if (!part) {
        const error = new Error('Part not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        message: 'Part updated successfully',
        part
      };
    } catch (error) {
      throw error;
    }
  }

  async deletePart(partId) {
    try {
      const part = await Part.findByIdAndDelete(partId);

      if (!part) {
        const error = new Error('Part not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        message: 'Part deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getPartStats() {
    try {
      const totalParts = await Part.countDocuments();
      const inStock = await Part.countDocuments({ status: 'Available', quantityInStock: { $gt: 0 } });
      const lowStock = await Part.countDocuments({
        status: 'Available',
        $expr: { $lte: ['$quantityInStock', '$minimumStockLevel'] }
      });
      const outOfStock = await Part.countDocuments({ status: 'Out of Stock' });

      return {
        success: true,
        stats: {
          total: totalParts,
          inStock,
          lowStock,
          outOfStock
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async updateStock(partId, quantity, operation = 'add') {
    try {
      const part = await Part.findById(partId);

      if (!part) {
        const error = new Error('Part not found');
        error.status = 404;
        throw error;
      }

      if (operation === 'add') {
        part.quantityInStock += quantity;
      } else if (operation === 'subtract') {
        if (part.quantityInStock < quantity) {
          const error = new Error('Insufficient stock');
          error.status = 400;
          throw error;
        }
        part.quantityInStock -= quantity;
      }

      // Update status based on quantity
      if (part.quantityInStock === 0) {
        part.status = 'Out of Stock';
      } else {
        part.status = 'Available';
      }

      part.updatedAt = Date.now();
      await part.save();

      return {
        success: true,
        message: 'Stock updated successfully',
        part
      };
    } catch (error) {
      throw error;
    }
  }

  async getLowStockParts() {
    try {
      const parts = await Part.find({
        $expr: { $lte: ['$quantityInStock', '$minimumStockLevel'] }
      })
        .populate('createdBy', 'name email')
        .sort({ quantityInStock: 1 });

      return {
        success: true,
        parts
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new PartService();
