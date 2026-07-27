import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendResponse } from '../utils/response';
import { z } from 'zod';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const authService = new AuthService();
const prisma = new PrismaClient();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = registerSchema.parse(req.body);
    const user = await authService.register(email, password, fullName);
    return sendResponse(res, 201, true, 'User registered successfully', {
      id: user.id,
      email: user.email,
    });
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login(email, password);
    return sendResponse(res, 200, true, 'Login successful', result);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return sendResponse(res, 400, false, 'Refresh token is required');
    }
    const result = await authService.refreshToken(refreshToken);
    return sendResponse(res, 200, true, 'Token refreshed successfully', result);
  } catch (error: any) {
    return sendResponse(res, 401, false, error.message);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    return sendResponse(res, 200, true, 'Logout successful');
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    if (!user) {
      return sendResponse(res, 401, false, 'Google authentication failed');
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    // In a real frontend app, we would redirect to the frontend with tokens in URL or Set-Cookie
    res.redirect(`http://localhost:5173/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (error: any) {
    res.redirect('http://localhost:5173/login?error=auth_failed');
  }
};
