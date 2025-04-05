const Image = require('../models/imageModel');
const exifr = require('exifr');
const { AppError } = require('../utils/errorHandler');

class ImageController {
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        throw new AppError('No image uploaded', 400);
      }

      // Extract metadata from image
      const metadata = await exifr.parse(req.file.path);
      console.log("metadata", metadata)
      
      if (!metadata?.latitude || !metadata?.longitude) {
        throw new AppError('Image missing required GPS coordinates', 400);
      }

      // For your sample image, the address might be in the Description or Title
      const address = metadata.Description || metadata.Title || 'No address provided';

      // Save to database
      const image = await Image.create({
        name: metadata.ImageDescription || req.file.originalname,
        latitude: metadata.latitude,
        longitude: metadata.longitude,
        address: address,
        filePath: req.file.path,
        metadata: JSON.stringify(metadata)
      });

      res.status(201).json({
        status: 'success',
        data: {
          id: image.id,
          name: image.name,
          latitude: image.latitude,
          longitude: image.longitude,
          address: image.address,
          metadata: image.metadata
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getImages(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        name,
        latitude,
        longitude,
        address
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtering
      if (name) where.name = { [Op.like]: `%${name}%` };
      if (latitude) where.latitude = parseFloat(latitude);
      if (longitude) where.longitude = parseFloat(longitude);
      if (address) where.address = { [Op.like]: `%${address}%` };

      const { count, rows } = await Image.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        status: 'success',
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        data: rows.map(row => ({
          id: row.id,
          name: row.name,
          latitude: row.latitude,
          longitude: row.longitude,
          address: row.address,
          metadata: row.metadata
        }))
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ImageController();