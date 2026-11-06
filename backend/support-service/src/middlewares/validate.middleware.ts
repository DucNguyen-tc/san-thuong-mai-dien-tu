import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Tham số truy vấn không hợp lệ",
          errors: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
}

