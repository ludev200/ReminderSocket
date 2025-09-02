import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev-secret";

export function issueToken(payload: object, expiresIn: SignOptions = { expiresIn: "1h" }): string {
  return jwt.sign(payload, JWT_SECRET, expiresIn);
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "missing token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}