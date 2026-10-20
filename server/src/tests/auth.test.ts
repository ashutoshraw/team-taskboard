import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app";
import { query } from "../db";
import pool from "../db";

beforeAll(async () => {
  await query("DELETE FROM users WHERE email = $1", ["testauth@example.com"]);
});

afterAll(async () => {
  await query("DELETE FROM users WHERE email = $1", ["testauth@example.com"]);
  await pool.end();
});

describe("POST /api/auth/register", () => {
  it("should register a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "testauth@example.com",
      name: "Test User",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body.user.email).toBe("testauth@example.com");
  });

  it("should reject duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "testauth@example.com",
      name: "Test User",
      password: "password123",
    });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("should login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "testauth@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
  });

  it("should reject wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "testauth@example.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });
});