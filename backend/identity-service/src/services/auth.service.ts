import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';
import { publishUserEvent } from '../rabbitmq/publisher';

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string, fullName: string): Promise<User> {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email is already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        full_name: fullName,
        auth_provider: 'LOCAL',
      },
    });

    publishUserEvent('user.registered', {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    if (!user.is_active) {
      throw new Error('Account is disabled');
    }

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    // Store refresh token
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string) {
    // Verify the refresh token to extract user ID
    let decoded: any;
    try {
      decoded = verifyRefreshToken(token);
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
    
    // Find refresh tokens for user
    const dbTokens = await prisma.refreshToken.findMany({
      where: { user_id: decoded.userId }
    });
    
    // Find the matching hashed token
    let matchedTokenId = null;
    for (const dbToken of dbTokens) {
      if (dbToken.expires_at < new Date()) continue; // Skip expired
      const isValid = await bcrypt.compare(token, dbToken.token_hash);
      if (isValid) {
        matchedTokenId = dbToken.id;
        break;
      }
    }
    
    if (!matchedTokenId) {
      throw new Error('Invalid or expired refresh token');
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({ userId: decoded.userId, role: decoded.role });
    return { accessToken };
  }

  async logout(token: string) {
    let decoded: any;
    try {
      decoded = verifyRefreshToken(token);
    } catch (e) {
      return; // If token is invalid, nothing to log out
    }
    
    const dbTokens = await prisma.refreshToken.findMany({
      where: { user_id: decoded.userId }
    });
    
    for (const dbToken of dbTokens) {
      const isValid = await bcrypt.compare(token, dbToken.token_hash);
      if (isValid) {
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
        break;
      }
    }
  }

  async googleLogin(profile: any) {
    let user = await prisma.user.findUnique({
      where: { google_id: profile.id },
    });

    if (!user) {
      const email = profile.emails?.[0]?.value || '';
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        user = await prisma.user.update({
          where: { email },
          data: {
            google_id: profile.id,
            auth_provider: 'GOOGLE',
            avatar_url: profile.photos?.[0]?.value,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: email,
            full_name: profile.displayName,
            google_id: profile.id,
            auth_provider: 'GOOGLE',
            avatar_url: profile.photos?.[0]?.value,
          },
        });
      }
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

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
      accessToken,
      refreshToken,
    };
  }
}
