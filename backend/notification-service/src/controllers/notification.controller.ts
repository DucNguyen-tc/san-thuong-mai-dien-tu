import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { sendResponse } from '../utils/response';
import { NotificationStatus } from '@prisma/client';

export const getNotificationLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const status = req.query.status as NotificationStatus | undefined;

    const where = status ? { status } : {};

    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return sendResponse(res, 200, true, 'Lấy danh sách log email thành công', {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      }
    });
  } catch (error) {
    next(error);
  }
};
