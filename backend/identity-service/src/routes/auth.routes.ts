import { Router } from 'express';
import { login, register, googleCallback } from '../controllers/auth.controller';
import passport from 'passport';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', require('../controllers/auth.controller').refreshToken);
router.post('/logout', require('../controllers/auth.controller').logout);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=auth_failed' }),
  googleCallback
);

export default router;
