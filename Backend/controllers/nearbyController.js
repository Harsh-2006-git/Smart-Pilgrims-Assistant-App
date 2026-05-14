import axios from 'axios';

/**
 * Get nearby places from Geoapify
 * GET /api/v1/nearby?category=...&lat=...&lng=...&radius=...
 */
export const getNearbyPlaces = async (req, res, next) => {
    try {
        const { category, lat, lng, radius = 5000 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and Longitude are required' });
        }

        const apiKey = process.env.GEOAPIFY_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'Geoapify API key not configured' });
        }

        // Map categories to Geoapify place categories
        // categories: hospital, hotel, restaurant, police, temple
        const categoryMap = {
            hospital: 'healthcare.hospital',
            hotel: 'accommodation.hotel',
            restaurant: 'catering.restaurant',
            police: 'service.police',
            temple: 'religion.place_of_worship'
        };

        const geoCategory = categoryMap[category] || 'healthcare.hospital';
        
        const url = `https://api.geoapify.com/v2/places?categories=${geoCategory}&filter=circle:${lng},${lat},${radius}&bias=proximity:${lng},${lat}&limit=20&apiKey=${apiKey}`;

        const response = await axios.get(url);

        const places = response.data.features.map(feature => {
            const { properties } = feature;
            return {
                name: properties.name || properties.street || 'Unknown Name',
                address: properties.formatted || properties.address_line2 || 'No address available',
                lat: properties.lat,
                lng: properties.lon,
                category: category,
                distance: properties.distance || 0
            };
        });

        // Sort by distance (nearest first)
        places.sort((a, b) => a.distance - b.distance);

        res.status(200).json(places);
    } catch (error) {
        next(error);
    }
};
