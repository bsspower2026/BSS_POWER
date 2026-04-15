// backend/services/DriverService.js

import Driver from '../models/Driver.js';

class DriverService {
  async createDriver(driverData, userId) {
    try {
      const driver = new Driver({
        ...driverData,
        createdBy: userId
      });

      await driver.save();

      return {
        success: true,
        message: 'Driver created successfully',
        driver
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllDrivers(query = {}) {
    try {
      const filter = {};

      // Search by name or license
      if (query.search) {
        filter.$or = [
          { firstName: { $regex: query.search, $options: 'i' } },
          { lastName: { $regex: query.search, $options: 'i' } },
          { licenseNumber: { $regex: query.search, $options: 'i' } },
          { phone: { $regex: query.search, $options: 'i' } }
        ];
      }

      // Filter by status
      if (query.status) {
        filter.status = query.status;
      }

      const drivers = await Driver.find(filter)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(query.limit ? parseInt(query.limit) : 100)
        .skip(query.skip ? parseInt(query.skip) : 0);

      const total = await Driver.countDocuments(filter);

      return {
        success: true,
        drivers,
        total,
        limit: query.limit ? parseInt(query.limit) : 100,
        skip: query.skip ? parseInt(query.skip) : 0
      };
    } catch (error) {
      throw error;
    }
  }

  async getDriverById(driverId) {
    try {
      const driver = await Driver.findById(driverId)
        .populate('createdBy', 'name email');

      if (!driver) {
        const error = new Error('Driver not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        driver
      };
    } catch (error) {
      throw error;
    }
  }

  async updateDriver(driverId, updateData) {
    try {
      const driver = await Driver.findByIdAndUpdate(
        driverId,
        {
          ...updateData,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      )
        .populate('createdBy', 'name email');

      if (!driver) {
        const error = new Error('Driver not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        message: 'Driver updated successfully',
        driver
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteDriver(driverId) {
    try {
      const driver = await Driver.findByIdAndDelete(driverId);

      if (!driver) {
        const error = new Error('Driver not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        message: 'Driver deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getDriverStats() {
    try {
      const totalDrivers = await Driver.countDocuments();
      const activeDrivers = await Driver.countDocuments({ status: 'Active' });
      const onLeave = await Driver.countDocuments({ status: 'On Leave' });
      const suspended = await Driver.countDocuments({ status: 'Suspended' });

      return {
        success: true,
        stats: {
          total: totalDrivers,
          active: activeDrivers,
          onLeave,
          suspended
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async checkLicenseExpiry() {
    try {
      const today = new Date();
      const expiringDrivers = await Driver.find({
        licenseExpiryDate: {
          $gt: today,
          $lt: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        }
      });

      return {
        success: true,
        expiringDrivers
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new DriverService();
