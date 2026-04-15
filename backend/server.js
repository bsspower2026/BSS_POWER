import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import authRoutes            from './routes/auth.js';
import vehicleRoutes         from './routes/vehicles.js';
import driverRoutes          from './routes/drivers.js';
import partRoutes            from './routes/parts.js';
import tripRoutes            from './routes/trips.js';
import driverTripRoutes      from './routes/driverTrips.js';
import helpersRouter         from './routes/helpers.js';
import siteSupervisorsRouter from './routes/siteSupervisors.js';
import issueActionsRouter    from './routes/issueActions.js';
import paymentsRouter        from './routes/payments.js';
import adminRouter           from './routes/admin.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'https://bss-power.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('CORS not allowed'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    await ensureAdminUser();
  })
  .catch(err => console.log('MongoDB connection error:', err));

// ── Auto-create admin user if not present ─────────────────────────────────────
async function ensureAdminUser() {
  try {
    const User = (await import('./models/User.js')).default;
    const exists = await User.findOne({ email: 'admin@bsspower.com' });
    if (!exists) {
      const admin = new User({
        name:     'Admin',
        email:    'admin@bsspower.com',
        password: 'admin@bss2026',
        role:     'admin',
        isActive: true,
      });
      await admin.save();
      console.log('✅ Admin user created: admin@bsspower.com / admin@bss2026');
    }
  } catch (err) {
    console.error('Failed to ensure admin user:', err.message);
  }
}

// Routes
app.use('/api/auth',             authRoutes);
app.use('/api/vehicles',         vehicleRoutes);
app.use('/api/drivers',          driverRoutes);
app.use('/api/parts',            partRoutes);
app.use('/api/trips',            tripRoutes);
app.use('/api/driver-trips',     driverTripRoutes);
app.use('/api/helpers',          helpersRouter);
app.use('/api/site-supervisors', siteSupervisorsRouter);
app.use('/api/issue-actions',    issueActionsRouter);
app.use('/api/payments',         paymentsRouter);
app.use('/api/admin',            adminRouter);

app.get('/api/health', (req, res) =>
  res.status(200).json({ message: 'Server is running', timestamp: new Date() })
);

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error', errors: err.errors || [] });
});

app.use((req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
});