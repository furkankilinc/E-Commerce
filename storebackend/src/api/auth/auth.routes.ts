import { Router } from 'express';
import { login, register, getMe, logout } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate('user'), getMe);

export default router;
