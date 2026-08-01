import { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma";
import { sendResponse } from "../utils/response";
import { NotFoundError } from "../exceptions/AppError";

export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: { updated_at: "desc" },
    });
    return sendResponse(
      res,
      200,
      true,
      "Lấy danh sách template thành công",
      templates,
    );
  } catch (error) {
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code } = req.params;
    const { subject_template, body_template } = req.body;

    const existingTemplate = await prisma.notificationTemplate.findUnique({
      where: { code },
    });

    if (!existingTemplate) {
      throw new NotFoundError(`Không tìm thấy template có mã ${code}`);
    }

    const updated = await prisma.notificationTemplate.update({
      where: { code },
      data: { subject_template, body_template },
    });

    return sendResponse(
      res,
      200,
      true,
      "Cập nhật template thành công",
      updated,
    );
  } catch (error) {
    next(error);
  }
};
