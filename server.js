const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');
const campaignsRoutes = require('./routes/campaigns');
const settingsRoutes = require('./routes/settings');
const { startEmailWorker } = require('./services/emailWorker');

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/settings', settingsRoutes);

// Start the background email dispatcher
startEmailWorker();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LeadRadar API is running' });
});

// Fallback to index.html for SPA (if we do client-side routing)
app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
