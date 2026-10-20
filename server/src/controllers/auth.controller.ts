import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, name, password_hash]
    );
    const user = result.rows[0];
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({ accessToken, user });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }
  try {
    const result = await query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const accessToken = generateAccessToken(payload.userId);
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};