const { Router } = require('express');
const { getAllCategories, getAllCategoriesAdmin, createCategory, updateCategory, deleteCategory } = require('./category.controller');
const router = Router();

router.get('/', getAllCategories);
router.get('/admin', getAllCategoriesAdmin);
router.post('/admin', createCategory);
router.put('/admin/:id', updateCategory);
router.delete('/admin/:id', deleteCategory);

module.exports = router;
