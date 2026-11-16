import { AuthService } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as jwtUtils from '../utils/jwt';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    }
  };
  return {
    PrismaClient: jest.fn(() => mPrisma)
  };
});

// Mock bcrypt
jest.mock('bcrypt');

// Mock jwt
jest.mock('../utils/jwt');

// Mock rabbitmq publisher
jest.mock('../rabbitmq/publisher', () => ({
  publishUserEvent: jest.fn()
}));

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;

  beforeEach(() => {
    authService = new AuthService();
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });

  describe('Register', () => {
    it('01. Đăng ký - Email đã tồn tại', async () => {
      // 1. Mock DB trả về tài khoản đã tồn tại
      prisma.user.findUnique.mockResolvedValue({ id: 1, email: 'test@gmail.com' });

      // 2. Gọi authService.register()
      await expect(authService.register('test@gmail.com', '123456', 'Nguyễn Văn A'))
        .rejects
        .toThrow('Email is already registered');

      // Đảm bảo không gọi hàm create
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('02. Đăng ký tài khoản thành công', async () => {
      // 1. Mock DB báo email chưa tồn tại
      prisma.user.findUnique.mockResolvedValue(null);
      
      // 2. Mock Bcrypt băm mật khẩu thành công
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      // Mock DB tạo user thành công
      const mockUser = { id: 1, email: 'test@gmail.com', full_name: 'Nguyễn Văn A', role: 'USER' };
      prisma.user.create.mockResolvedValue(mockUser);

      // 3. Gọi authService.register()
      const result = await authService.register('test@gmail.com', '123456', 'Nguyễn Văn A');

      // Kết quả trả về phải khớp với user tạo mới
      expect(result).toEqual(mockUser);
      // Đảm bảo Prisma.create được gọi với tham số đã mã hoá password
      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            email: 'test@gmail.com',
            password_hash: 'hashed_password'
        })
      }));
    });
  });

  describe('Login', () => {
    it('03. Đăng nhập - Sai Email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(authService.login('wrong@gmail.com', '123456'))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('04. Đăng nhập - Sai mật khẩu', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, password_hash: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(authService.login('test@gmail.com', 'wrongpass'))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('05. Đăng nhập thành công', async () => {
      const mockUser = { id: 1, email: 'test@gmail.com', full_name: 'Name', is_active: true, password_hash: 'hashed', role: 'USER' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh_token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_refresh_token');

      const result = await authService.login('test@gmail.com', '123456');

      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken', 'access_token');
      expect(result).toHaveProperty('refreshToken', 'refresh_token');
    });
  });

  describe('Refresh Token', () => {
    it('06. Làm mới Token - JWT hết hạn', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('TokenExpiredError');
      });

      await expect(authService.refreshToken('expired_token'))
        .rejects
        .toThrow('Invalid refresh token');
    });

    it('07. Làm mới Token - Không có trong DB', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 1, role: 'USER' });
      prisma.refreshToken.findMany.mockResolvedValue([]);

      await expect(authService.refreshToken('valid_jwt_but_revoked'))
        .rejects
        .toThrow('Invalid or expired refresh token');
    });

    it('08. Làm mới Token thành công', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 1, role: 'USER' });
      prisma.refreshToken.findMany.mockResolvedValue([
        { id: 10, expires_at: new Date(Date.now() + 100000), token_hash: 'hash' }
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('new_access_token');

      const result = await authService.refreshToken('valid_token');
      expect(result).toEqual({ accessToken: 'new_access_token' });
    });
  });

  describe('Logout', () => {
    it('09. Đăng xuất (Logout) thành công', async () => {
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 1 });
      prisma.refreshToken.findMany.mockResolvedValue([
        { id: 99, token_hash: 'hash' }
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.logout('valid_token');

      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 99 } });
    });
  });

  describe('Google OAuth', () => {
    it('10. Đăng nhập bằng Google OAuth', async () => {
      const mockProfile = {
        id: 'google123',
        displayName: 'Google User',
        emails: [{ value: 'google@gmail.com' }],
        photos: [{ value: 'avatar_url' }]
      };

      // Mock DB: user not found by google_id, and not found by email
      prisma.user.findUnique.mockResolvedValueOnce(null)
                            .mockResolvedValueOnce(null);
      
      const mockNewUser = { id: 2, email: 'google@gmail.com', role: 'USER' };
      prisma.user.create.mockResolvedValue(mockNewUser);
      
      (jwtUtils.generateAccessToken as jest.Mock).mockReturnValue('access_token');
      (jwtUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh_token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_refresh');

      const result = await authService.googleLogin(mockProfile);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('access_token');
    });
  });
});
