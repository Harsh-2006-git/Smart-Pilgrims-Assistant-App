import LocationLog from '../models/LocationLog.js';
import GuardianMapping from '../models/GuardianMapping.js';
import Client from '../models/client.js';
import { Op } from 'sequelize';

// 1. Get location history of a user
export const getLocationHistory = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.client_id;

        // Check if the user is authorized (is self or approved guardian)
        if (currentUserId != userId) {
            const isGuardian = await GuardianMapping.findOne({
                where: { user_id: userId, guardian_id: currentUserId, is_approved: true }
            });
            if (!isGuardian) {
                return res.status(403).json({ message: 'Unauthorized profile tracking' });
            }
        }

        const history = await LocationLog.findAll({
            where: { user_id: userId },
            order: [['timestamp', 'ASC']],
            limit: 500 // Limit for performance
        });

        res.json(history);
    } catch (error) {
        next(error);
    }
};

// 2. Add a guardian
export const addGuardian = async (req, res, next) => {
    try {
        const { guardianId } = req.body;
        const userId = req.user.client_id; // From JWT

        if (userId == guardianId) {
            return res.status(400).json({ message: 'You cannot be your own guardian' });
        }

        const mapping = await GuardianMapping.create({
            user_id: userId,
            guardian_id: guardianId,
            is_approved: false
        });

        res.status(201).json(mapping);
    } catch (error) {
        next(error);
    }
};

// 3. Approve a tracking request
export const approveTracking = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const guardianId = req.user.client_id;

        const mapping = await GuardianMapping.findOne({
            where: { user_id: userId, guardian_id: guardianId }
        });

        if (!mapping) {
            return res.status(404).json({ message: 'Request not found' });
        }

        mapping.is_approved = true;
        await mapping.save();

        res.json({ message: 'Approved successfully', mapping });
    } catch (error) {
        next(error);
    }
};

// 4. List my guardians
export const getMyGuardians = async (req, res, next) => {
    try {
        const userId = req.user.client_id;
        const guardians = await GuardianMapping.findAll({
            where: { user_id: userId },
            include: [{ model: Client, as: 'guardian', attributes: ['client_id', 'name', 'phone', 'email'] }]
        });
        res.json(guardians);
    } catch (error) {
        next(error);
    }
};

// 5. List people I am tracking (Approved)
export const getTrackingProtégés = async (req, res, next) => {
    try {
        const guardianId = req.user.client_id;
        const protégés = await GuardianMapping.findAll({
            where: { guardian_id: guardianId, is_approved: true },
            include: [{ model: Client, as: 'user', attributes: ['client_id', 'name', 'phone', 'email'] }]
        });
        res.json(protégés);
    } catch (error) {
        next(error);
    }
};

// 6. List pending association requests (where I am the guardian)
export const getPendingGuardianRequests = async (req, res, next) => {
    try {
        const guardianId = req.user.client_id;
        const pending = await GuardianMapping.findAll({
            where: { guardian_id: guardianId, is_approved: false },
            include: [{ model: Client, as: 'user', attributes: ['client_id', 'name', 'phone', 'email'] }]
        });
        res.json(pending);
    } catch (error) {
        next(error);
    }
};
