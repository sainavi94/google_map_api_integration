const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.config');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: -90, max: 90 }
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: { min: -180, max: 180 }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Image;