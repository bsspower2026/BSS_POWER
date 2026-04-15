import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Driver from '../models/Driver.js';
import Part from '../models/Part.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Part.deleteMany({});
    console.log('Cleared existing data');

    // Create default users
    const employees = await User.create([
      {
        name: 'Employee User',
        email: 'employee@bsspower.com',
        password: 'emp123',
        role: 'employee',
        phone: '9876543210',
        city: 'New Delhi',
        state: 'Delhi'
      },
      {
        name: 'Supervisor User',
        email: 'supervisor@bsspower.com',
        password: 'sup123',
        role: 'supervisor',
        phone: '9876543211',
        city: 'Mumbai',
        state: 'Maharashtra'
      },
      {
        name: 'Driver User',
        email: 'driver@bsspower.com',
        password: 'drv123',
        role: 'driver',
        phone: '9876543212',
        city: 'Bangalore',
        state: 'Karnataka'
      }
    ]);
    console.log('Created default users');

    // Create sample parts
    const parts = await Part.create([
      {
        partName: 'Oil Filter',
        partCode: 'OF-001',
        category: 'Engine',
        unitOfMeasurement: 'Piece',
        quantityInStock: 50,
        costPrice: 100,
        sellingPrice: 150,
        createdBy: employees[0]._id
      },
      {
        partName: 'Air Filter',
        partCode: 'AF-001',
        category: 'Engine',
        unitOfMeasurement: 'Piece',
        quantityInStock: 30,
        costPrice: 80,
        sellingPrice: 120,
        createdBy: employees[0]._id
      },
      {
        partName: 'Brake Pads',
        partCode: 'BP-001',
        category: 'Brakes',
        unitOfMeasurement: 'Set',
        quantityInStock: 20,
        costPrice: 500,
        sellingPrice: 800,
        createdBy: employees[0]._id
      },
      {
        partName: 'Battery',
        partCode: 'BAT-001',
        category: 'Electrical',
        unitOfMeasurement: 'Piece',
        quantityInStock: 15,
        costPrice: 2000,
        sellingPrice: 3000,
        createdBy: employees[0]._id
      },
      {
        partName: 'Engine Oil',
        partCode: 'EO-001',
        category: 'Engine',
        unitOfMeasurement: 'Liter',
        quantityInStock: 100,
        costPrice: 200,
        sellingPrice: 350,
        createdBy: employees[0]._id
      }
    ]);
    console.log('Created sample parts');

    // Create sample vehicles
    const vehicles = await Vehicle.create([
      {
        registrationNumber: 'DL-01-AA-1234',
        vehicleType: 'Car',
        make: 'Maruti',
        model: 'Swift',
        year: 2022,
        color: 'Silver',
        fuelType: 'Petrol',
        status: 'Active',
        location: 'Delhi Depot',
        assignedParts: [
          {
            partId: parts[0]._id,
            quantity: 1,
            unit: 'Piece'
          },
          {
            partId: parts[1]._id,
            quantity: 1,
            unit: 'Piece'
          }
        ],
        createdBy: employees[0]._id
      },
      {
        registrationNumber: 'MH-02-BB-5678',
        vehicleType: 'Bus',
        make: 'Tata',
        model: 'AC Bus',
        year: 2021,
        color: 'Blue',
        fuelType: 'Diesel',
        status: 'Active',
        location: 'Mumbai Depot',
        assignedParts: [
          {
            partId: parts[2]._id,
            quantity: 4,
            unit: 'Set'
          },
          {
            partId: parts[3]._id,
            quantity: 2,
            unit: 'Piece'
          }
        ],
        createdBy: employees[0]._id
      },
      {
        registrationNumber: 'KA-03-CC-9012',
        vehicleType: 'Truck',
        make: 'Ashok Leyland',
        model: 'Hino',
        year: 2020,
        color: 'Green',
        fuelType: 'Diesel',
        status: 'Under Maintenance',
        location: 'Bangalore Depot',
        assignedParts: [],
        createdBy: employees[0]._id
      }
    ]);
    console.log('Created sample vehicles');

    // Create sample drivers
    const drivers = await Driver.create([
      {
        firstName: 'Raj',
        lastName: 'Kumar',
        phone: '9988776655',
        email: 'raj.kumar@example.com',
        licenseNumber: 'DL0120220012345',
        licenseCategory: ['HMV'],
        licenseIssueDate: new Date('2020-01-01'),
        licenseExpiryDate: new Date('2030-01-01'),
        status: 'Active',
        createdBy: employees[0]._id
      },
      {
        firstName: 'Priya',
        lastName: 'Singh',
        phone: '9988776656',
        email: 'priya.singh@example.com',
        licenseNumber: 'MH0120220012346',
        licenseCategory: ['HMV', 'LMV'],
        licenseIssueDate: new Date('2019-06-15'),
        licenseExpiryDate: new Date('2029-06-15'),
        status: 'Active',
        createdBy: employees[0]._id
      },
      {
        firstName: 'Arjun',
        lastName: 'Patel',
        phone: '9988776657',
        email: 'arjun.patel@example.com',
        licenseNumber: 'GJ0120210012347',
        licenseCategory: ['HMV'],
        licenseIssueDate: new Date('2021-03-20'),
        licenseExpiryDate: new Date('2026-03-20'),
        status: 'Active',
        createdBy: employees[0]._id
      }
    ]);
    console.log('Created sample drivers');

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDefault Users:');
    console.log('- Email: employee@bsspower.com | Password: emp123 | Role: Employee');
    console.log('- Email: supervisor@bsspower.com | Password: sup123 | Role: Supervisor');
    console.log('- Email: driver@bsspower.com | Password: drv123 | Role: Driver');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
