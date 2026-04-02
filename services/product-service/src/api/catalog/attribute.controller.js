const prisma = require('../../config/prisma');

const getAllAttributes = async (req, res) => {
    try {
        const attributes = await prisma.attribute.findMany({
            include: { values: true }
        });
        return res.json(attributes);
    } catch (err) {
        console.error('[ATTRIBUTE] Error:', err);
        return res.status(500).json({ success: false, message: 'Özellikler yüklenemedi.' });
    }
};

module.exports = { getAllAttributes };
