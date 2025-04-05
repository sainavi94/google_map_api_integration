require('dotenv').config();
const express = require('express');
const sequelize = require('./config/db.config');
const imageRoutes = require('./routes/imageRoutes');
const { errorHandler } = require('./utils/errorHandler');
const path = require('path');
const { Sequelize } = require('sequelize');

const app = express();

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/images', imageRoutes);

// Error handling
app.use(errorHandler);

// Database sync and server start
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    // Create a temporary Sequelize instance to create the database
    const tempSequelize = new Sequelize({
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Sai@123',
    });

    // Create the database if it doesn't exist
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'image_metadata'}`);
    console.log(`Database ${process.env.DB_NAME || 'image_metadata'} created or already exists`);

    // Close the temporary connection
    await tempSequelize.close();

    // Now authenticate with the main sequelize instance
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Sync the models (create tables if they don't exist)
    await sequelize.sync({ alter: true });

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();