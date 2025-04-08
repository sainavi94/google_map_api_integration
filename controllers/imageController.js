const Image = require('../models/imageModel');
const exifr = require('exifr');
const { AppError } = require('../utils/errorHandler');
const axios = require('axios');

class ImageController {

  getAddressFromCoordinates =  async (latitude, longitude) => {
    try {
      const url = process.env.GOOGLE_API_ENDPOINT;
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new AppError('Google Maps API key is missing', 500);
      }

      const response = await axios.get(`${url}?latlng=${latitude},${longitude}&key=${apiKey}`);


      const data = response.data;
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.log('Geocoding failed:', data.status);
        return 'Address not found';
      }
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return 'Address not found';
    }
  }

  uploadImage = async (req, res, next) => {
    try {
      if (!req.file) {
        throw new AppError('No image uploaded', 400);
      }

      const metadata = await exifr.parse(req.file.path, { 
        translateValues: true, 
        translateKeys: true,
        mergeOutput: true,
        tiff: true,
        exif: true,
        gps: true 
      });

      let latitude = metadata?.latitude;
      let longitude = metadata?.longitude;
      let address = 'No address provided';

      if (!latitude || !longitude) {
        throw new AppError('Image missing required GPS coordinates', 400);
      }

      // Getting the address using Google Maps API
      address = await this.getAddressFromCoordinates(latitude, longitude);

      const image = await Image.create({
        name: metadata.ImageDescription || req.file.originalname,
        latitude,
        longitude,
        address,
        filePath: req.file.path,
        metadata: JSON.stringify(metadata)
      });

      res.status(201).json({
        status: "success",
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