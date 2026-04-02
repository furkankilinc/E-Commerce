const getCollections = async (req, res) => {
    return res.json([]);
};

const createCollection = async (req, res) => {
    return res.status(201).json({ success: true, message: 'Koleksiyon oluşturuldu.' });
};

module.exports = { getCollections, createCollection };
