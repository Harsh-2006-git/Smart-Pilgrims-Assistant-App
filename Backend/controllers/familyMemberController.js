// controllers/familyMemberController.js
import FamilyMember from "../models/familyMember.js";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export const addFamilyMember = async (req, res, next) => {
    try {
        const { name, relationship } = req.body;
        const { client_id } = req.user;

        if (!name || !relationship) {
            return res.status(400).json({ message: "Name and relationship are required" });
        }

        const unique_code = `FAM-${uuidv4().split("-")[0].toUpperCase()}`;

        // Generate QR
        const qrData = { unique_code, client_id, type: "family" };
        const qr_image = await QRCode.toDataURL(JSON.stringify(qrData));

        const member = await FamilyMember.create({
            client_id,
            name,
            relationship,
            unique_code,
            qr_image,
        });

        res.status(201).json({ message: "Family member added", member });
    } catch (error) {
        next(error);
    }
};

export const getFamilyMembers = async (req, res, next) => {
    try {
        const { client_id } = req.user;
        const members = await FamilyMember.findAll({ where: { client_id } });
        res.json({ members });
    } catch (error) {
        next(error);
    }
};

export const deleteFamilyMember = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { client_id } = req.user;

        const result = await FamilyMember.destroy({
            where: { member_id: id, client_id },
        });

        if (!result) return res.status(404).json({ message: "Member not found" });

        res.json({ message: "Member removed" });
    } catch (error) {
        next(error);
    }
};
