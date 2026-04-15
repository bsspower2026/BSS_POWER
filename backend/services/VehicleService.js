// backend/services/VehicleService.js

import Vehicle from '../models/Vehicle.js';

class VehicleService {
  async createVehicle(vehicleData, userId) {
    try {
      const vehicle = new Vehicle({
        ...vehicleData,
        createdBy: userId
      });

      await vehicle.save();
      await vehicle.populate('assignedParts.partId', 'partName partCode unitOfMeasurement');

      return {
        success: true,
        message: 'Vehicle created successfully',
        vehicle
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllVehicles(query = {}) {
    try {
      const filter = {};

      // Search by registration number
      if (query.search) {
        filter.$or = [
          { registrationNumber: { $regex: query.search, $options: 'i' } },
          { make: { $regex: query.search, $options: 'i' } },
          { model: { $regex: query.search, $options: 'i' } }
        ];
      }

      // Filter by status
      if (query.status) {
        filter.status = query.status;
      }

      // Filter by vehicle type
      if (query.vehicleType) {
        filter.vehicleType = query.vehicleType;
      }

      const vehicles = await Vehicle.find(filter)
        .populate('assignedParts.partId', 'partName partCode unitOfMeasurement')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(query.limit ? parseInt(query.limit) : 100)
        .skip(query.skip ? parseInt(query.skip) : 0);

      const total = await Vehicle.countDocuments(filter);

      return {
        success: true,
        vehicles,
        total,
        limit: query.limit ? parseInt(query.limit) : 100,
        skip: query.skip ? parseInt(query.skip) : 0
      };
    } catch (error) {
      throw error;
    }
  }

  async getVehicleById(vehicleId) {
    try {
      const vehicle = await Vehicle.findById(vehicleId)
        .populate('assignedParts.partId')
        .populate('createdBy', 'name email');

      if (!vehicle) {
        const error = new Error('Vehicle not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        vehicle
      };
    } catch (error) {
      throw error;
    }
  }

  async updateVehicle(vehicleId, updateData) {
    try {
      const vehicle = await Vehicle.findByIdAndUpdate(
        vehicleId,
        {
          ...updateData,
          updatedAt: Date.now()
        },
        { new: true, runValidators: true }
      )
        .populate('assignedParts.partId')
        .populate('createdBy', 'name email');

      if (!vehicle) {
        const error = new Error('Vehicle not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        message: 'Vehicle updated successfully',
        vehicle
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteVehicle(vehicleId) {
    try {
      const vehicle = await Vehicle.findByIdAndDelete(vehicleId);

      if (!vehicle) {
        const error = new Error('Vehicle not found');
        error.status = 404;
        throw error;
      }

      return {
        success: true,
        message: 'Vehicle deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async assignParts(vehicleId, parts) {
    try {
      const vehicle = await Vehicle.findById(vehicleId);

      if (!vehicle) {
        const error = new Error('Vehicle not found');
        error.status = 404;
        throw error;
      }

      vehicle.assignedParts = parts;
      vehicle.updatedAt = Date.now();
      await vehicle.save();
      await vehicle.populate('assignedParts.partId', 'partName partCode unitOfMeasurement');

      return {
        success: true,
        message: 'Parts assigned successfully',
        vehicle
      };
    } catch (error) {
      throw error;
    }
  }

  async getVehicleStats() {
    try {
      const totalVehicles = await Vehicle.countDocuments();
      const activeVehicles = await Vehicle.countDocuments({ status: 'Active' });
      const underMaintenance = await Vehicle.countDocuments({ status: 'Under Maintenance' });
      const inactive = await Vehicle.countDocuments({ status: 'Inactive' });

      return {
        success: true,
        stats: {
          total: totalVehicles,
          active: activeVehicles,
          underMaintenance,
          inactive
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new VehicleService();
