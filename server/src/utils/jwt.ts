import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export const generateAccessToken = (userId: number) =>
  jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: "15m" });

export const generateRefreshToken = (userId: number) =>
  jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET) as { userId: number };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET) as { userId: number };