const express = require('express');
const parkingController = require('../controllers/parkingController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/available', parkingController.getAvailableSpots);
router.get('/all', authMiddleware, adminMiddleware, parkingController.getAllSpots);
router.post('/book', authMiddleware, parkingController.bookSpot);
router.post('/release', authMiddleware, parkingController.releaseSpot);
router.get('/reservations', authMiddleware, parkingController.getUserReservations);

module.exports = router;
