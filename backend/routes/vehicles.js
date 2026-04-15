import express from 'express';
import Vehicle from '../models/Vehicle.js';

const router = express.Router();

// Create vehicle
router.post('/', async (req, res) => {
  try {
    const vehicleData = req.body;
    
    const newVehicle = new Vehicle({
      registrationNumber: vehicleData.registrationNumber,
      licensePlate: vehicleData.licensePlate,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      color: vehicleData.color,
      vin: vehicleData.vin,
      fuelType: vehicleData.fuelType,
      avgMileage: vehicleData.avgMileage,
      gpsDeviceId: vehicleData.gpsDeviceId,
      trackingDeviceModel: vehicleData.trackingDeviceModel,
      simCardNumber: vehicleData.simCardNumber,
      insuranceProvider: vehicleData.insuranceProvider,
      insurancePolicyNumber: vehicleData.insurancePolicyNumber,
      insuranceExpiryDate: vehicleData.insuranceExpiryDate,
      registrationExpiryDate: vehicleData.registrationExpiryDate,
      lastServiceDate: vehicleData.lastServiceDate,
      nextServiceDate: vehicleData.nextServiceDate,
      lastServiceMileage: vehicleData.lastServiceMileage,
      maintenanceNotes: vehicleData.maintenanceNotes,
      status: vehicleData.status,
      purchaseDate: vehicleData.purchaseDate,
      purchasePrice: vehicleData.purchasePrice,
      assignedDriver: vehicleData.assignedDriver,
      notes: vehicleData.notes,
      photos: vehicleData.photos || []
    });

    await newVehicle.save();
    
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: newVehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle',
      error: error.message
    });
  }
});

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const filter = {};

    if (req.query.search) {
      filter.$or = [
        { registrationNumber: { $regex: req.query.search, $options: 'i' } },
        { model: { $regex: req.query.search, $options: 'i' } },
        { make: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const vehicles = await Vehicle.find(filter)
      .populate('assignedDriver', 'firstName lastName phone')
      .sort({ createdAt: -1 });

    const formattedVehicles = vehicles.map(vehicle => ({
      _id: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      vin: vehicle.vin,
      fuelType: vehicle.fuelType,
      avgMileage: vehicle.avgMileage,
      gpsDeviceId: vehicle.gpsDeviceId,
      status: vehicle.status,
      photos: vehicle.photos,
      assignedDriver: vehicle.assignedDriver
    }));
    
    res.status(200).json({
      success: true,
      data: formattedVehicles,
      total: vehicles.length
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('assignedDriver', 'firstName lastName phone email');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    const formattedVehicle = {
      _id: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      licensePlate: vehicle.licensePlate,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      vin: vehicle.vin,
      fuelType: vehicle.fuelType,
      avgMileage: vehicle.avgMileage,
      gpsDeviceId: vehicle.gpsDeviceId,
      trackingDeviceModel: vehicle.trackingDeviceModel,
      simCardNumber: vehicle.simCardNumber,
      insuranceProvider: vehicle.insuranceProvider,
      insurancePolicyNumber: vehicle.insurancePolicyNumber,
      insuranceExpiryDate: vehicle.insuranceExpiryDate ? vehicle.insuranceExpiryDate.toISOString().split('T')[0] : '',
      registrationExpiryDate: vehicle.registrationExpiryDate ? vehicle.registrationExpiryDate.toISOString().split('T')[0] : '',
      lastServiceDate: vehicle.lastServiceDate ? vehicle.lastServiceDate.toISOString().split('T')[0] : '',
      nextServiceDate: vehicle.nextServiceDate ? vehicle.nextServiceDate.toISOString().split('T')[0] : '',
      lastServiceMileage: vehicle.lastServiceMileage,
      maintenanceNotes: vehicle.maintenanceNotes,
      status: vehicle.status,
      purchaseDate: vehicle.purchaseDate ? vehicle.purchaseDate.toISOString().split('T')[0] : '',
      purchasePrice: vehicle.purchasePrice,
      assignedDriver: vehicle.assignedDriver,
      notes: vehicle.notes,
      photos: vehicle.photos
    };
    
    res.status(200).json({
      success: true,
      data: formattedVehicle
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error.message
    });
  }
});

// Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const vehicleData = req.body;
    
    const updateData = {
      registrationNumber: vehicleData.registrationNumber,
      licensePlate: vehicleData.licensePlate,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      color: vehicleData.color,
      vin: vehicleData.vin,
      fuelType: vehicleData.fuelType,
      avgMileage: vehicleData.avgMileage,
      gpsDeviceId: vehicleData.gpsDeviceId,
      trackingDeviceModel: vehicleData.trackingDeviceModel,
      simCardNumber: vehicleData.simCardNumber,
      insuranceProvider: vehicleData.insuranceProvider,
      insurancePolicyNumber: vehicleData.insurancePolicyNumber,
      insuranceExpiryDate: vehicleData.insuranceExpiryDate,
      registrationExpiryDate: vehicleData.registrationExpiryDate,
      lastServiceDate: vehicleData.lastServiceDate,
      nextServiceDate: vehicleData.nextServiceDate,
      lastServiceMileage: vehicleData.lastServiceMileage,
      maintenanceNotes: vehicleData.maintenanceNotes,
      status: vehicleData.status,
      purchaseDate: vehicleData.purchaseDate,
      purchasePrice: vehicleData.purchasePrice,
      assignedDriver: vehicleData.assignedDriver,
      notes: vehicleData.notes,
      photos: vehicleData.photos || [],
      updatedAt: new Date()
    };
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || updateData[key] === '') {
        delete updateData[key];
      }
    });
    
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message
    });
  }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: error.message
    });
  }
});

// Get vehicle statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: 'active' });
    const underMaintenance = await Vehicle.countDocuments({ status: 'maintenance' });
    const inactive = await Vehicle.countDocuments({ status: 'inactive' });
    
    res.status(200).json({
      success: true,
      stats: {
        total: totalVehicles,
        active: activeVehicles,
        underMaintenance,
        inactive
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

export default router;