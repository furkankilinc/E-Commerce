const { Router } = require('express');
const {
    getAllUsers,
    updateUserStatus,
    deleteUser
} = require('./user.admin.controller');
const { authenticate, requireSuperAdmin } = require('../../middlewares/auth.middleware');

const router = Router();

// /api/admin/users
router.get('/', authenticate('admin'), getAllUsers);
router.patch('/:id/status', authenticate('admin'), requireSuperAdmin, updateUserStatus);
router.delete('/:id', authenticate('admin'), requireSuperAdmin, deleteUser);

module.exports = router;
