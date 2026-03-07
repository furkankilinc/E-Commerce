const { Router } = require('express');
const redis = require('../../config/redis');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

const getCollectionsKey = (id) => `collections:${id}`;

// Helper: get all collections for a user
const getCollections = async (collectionsId) => {
    const data = await redis.get(getCollectionsKey(collectionsId));
    return data ? JSON.parse(data) : [];
};

const saveCollections = async (collectionsId, collections) => {
    await redis.set(getCollectionsKey(collectionsId), JSON.stringify(collections), 'EX', 60 * 60 * 24 * 90); // 90 days
};

// GET /api/collections — Get all collections
router.get('/', authenticate('user'), async (req, res) => {
    try {
        const collectionsId = req.user.sub;
        const collections = await getCollections(collectionsId);
        res.json(collections);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching collections', error: err.message });
    }
});

// POST /api/collections — Create a new collection
router.post('/', authenticate('user'), async (req, res) => {
    try {
        const collectionsId = req.user.sub;
        const { name, emoji } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({ message: 'Collection name is required.' });
        }

        const collections = await getCollections(collectionsId);
        const newCollection = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
            name: name.trim(),
            emoji: emoji || '📦',
            items: [],
            createdAt: new Date().toISOString(),
        };

        collections.push(newCollection);
        await saveCollections(collectionsId, collections);
        res.status(201).json(newCollection);
    } catch (err) {
        res.status(500).json({ message: 'Error creating collection', error: err.message });
    }
});

// PUT /api/collections/:collectionId — Rename / update a collection
router.put('/:collectionId', authenticate('user'), async (req, res) => {
    try {
        const collectionsId = req.user.sub;
        const { collectionId } = req.params;
        const { name, emoji } = req.body;

        const collections = await getCollections(collectionsId);
        const idx = collections.findIndex(c => c.id === collectionId);
        if (idx === -1) return res.status(404).json({ message: 'Collection not found.' });

        if (name) collections[idx].name = name.trim();
        if (emoji) collections[idx].emoji = emoji;

        await saveCollections(collectionsId, collections);
        res.json(collections[idx]);
    } catch (err) {
        res.status(500).json({ message: 'Error updating collection', error: err.message });
    }
});

// DELETE /api/collections/:collectionId — Delete a collection
router.delete('/:collectionId', authenticate('user'), async (req, res) => {
    try {
        const collectionsId = req.user.sub;
        const { collectionId } = req.params;

        const collections = await getCollections(collectionsId);
        const updated = collections.filter(c => c.id !== collectionId);
        await saveCollections(collectionsId, updated);
        res.json({ message: 'Collection deleted.' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting collection', error: err.message });
    }
});

// POST /api/collections/:collectionId/items — Add product to a collection
router.post('/:collectionId/items', authenticate('user'), async (req, res) => {
    try {
        const collectionsId = req.user.sub;
        const { collectionId } = req.params;
        const { product } = req.body; // { id, name, price, image, category, slug }

        const collections = await getCollections(collectionsId);
        const idx = collections.findIndex(c => c.id === collectionId);
        if (idx === -1) return res.status(404).json({ message: 'Collection not found.' });

        const alreadyExists = collections[idx].items.some(i => i.id === product.id);
        if (!alreadyExists) {
            collections[idx].items.push({ ...product, addedAt: new Date().toISOString() });
            await saveCollections(collectionsId, collections);
        }

        res.json(collections[idx]);
    } catch (err) {
        res.status(500).json({ message: 'Error adding item to collection', error: err.message });
    }
});

// DELETE /api/collections/:collectionId/items/:productId — Remove product from collection
router.delete('/:collectionId/items/:productId', authenticate('user'), async (req, res) => {
    try {
        const collectionsId = req.user.sub;
        const { collectionId, productId } = req.params;

        const collections = await getCollections(collectionsId);
        const idx = collections.findIndex(c => c.id === collectionId);
        if (idx === -1) return res.status(404).json({ message: 'Collection not found.' });

        collections[idx].items = collections[idx].items.filter(i => i.id !== productId);
        await saveCollections(collectionsId, collections);
        res.json(collections[idx]);
    } catch (err) {
        res.status(500).json({ message: 'Error removing item from collection', error: err.message });
    }
});

module.exports = router;
