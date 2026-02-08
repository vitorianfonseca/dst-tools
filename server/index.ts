import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import jwt from "jsonwebtoken";
import crypto from "crypto";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const connectionString = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET || "dev-secret-key-change-in-production";

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });

// Hash password using SHA256
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
}

// Verify JWT token
function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, jwtSecret) as { userId: string };
  } catch {
    return null;
  }
}

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ============ AUTHENTICATION ENDPOINTS ============

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, display_name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Check if user already exists
    const existing = await pool.query(
      "SELECT id FROM auth_users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      res.status(409).json({ error: "User already exists" });
      return;
    }

    // Create user in auth_users table
    const userId = crypto.randomUUID();
    const passwordHash = hashPassword(password);

    await pool.query(
      "INSERT INTO auth_users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)",
      [userId, email, passwordHash, display_name || email]
    );

    // Ensure profile exists
    await pool.query(
      `INSERT INTO profiles (id, email, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name`,
      [userId, email, display_name || email]
    );

    const token = generateToken(userId);

    res.status(201).json({
      user: { id: userId, email, name: display_name || email },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to sign up" });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, name, password_hash FROM auth_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];
    const passwordHash = hashPassword(password);

    if (user.password_hash !== passwordHash) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to sign in" });
  }
});

app.get("/api/auth/session", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Missing token" });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    // Fetch user from database
    const result = await pool.query(
      "SELECT id, email, name FROM auth_users WHERE id = $1",
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({
      user: result.rows[0],
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

app.post("/api/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

// ============ END AUTHENTICATION ENDPOINTS ============


app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM profiles WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.get("/api/profiles", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const exclude = String(req.query.exclude || "").trim();
    const limit = Number(req.query.limit || 10);

    if (!search) {
      res.json([]);
      return;
    }

    const params: Array<string | number> = [`%${search}%`];
    let query = "SELECT * FROM profiles WHERE display_name ILIKE $1";

    if (exclude) {
      params.push(exclude);
      query += ` AND id <> $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY display_name ASC LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to search profiles" });
  }
});

app.put("/api/profiles/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email = null,
      display_name = null,
      avatar_url = null,
      bio = null,
      banner_url = null,
      is_private = false,
    } = req.body || {};

    // Check if email is already used by another profile
    if (email) {
      const existingEmail = await pool.query(
        "SELECT id FROM profiles WHERE email = $1 AND id != $2",
        [email, id]
      );

      if (existingEmail.rows.length > 0) {
        res.status(409).json({ error: "Email already in use by another profile" });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO profiles (id, email, display_name, avatar_url, bio, banner_url, is_private)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         bio = EXCLUDED.bio,
         banner_url = EXCLUDED.banner_url,
         is_private = EXCLUDED.is_private
       RETURNING *`,
      [id, email, display_name, avatar_url, bio, banner_url, is_private]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upsert profile" });
  }
});

app.get("/api/workspaces", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const result = await pool.query(
      "SELECT * FROM workspaces WHERE user_id = $1 ORDER BY updated_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch workspaces" });
  }
});

app.get("/api/workspaces/public", async (req, res) => {
  try {
    const exclude = String(req.query.excludeUserId || "").trim();
    const params: Array<string> = [];
    let query =
      "SELECT w.*, p.id AS owner_id, p.display_name, p.avatar_url FROM workspaces w LEFT JOIN profiles p ON p.id = w.user_id WHERE w.visibility = 'public'";

    if (exclude) {
      params.push(exclude);
      query += ` AND w.user_id <> $1`;
    }

    query += " ORDER BY w.created_at DESC";

    const result = await pool.query(query, params);
    const mapped = result.rows.map((row) => ({
      ...row,
      owner: row.owner_id
        ? {
          id: row.owner_id,
          display_name: row.display_name,
          avatar_url: row.avatar_url,
        }
        : null,
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch public workspaces" });
  }
});

app.post("/api/workspaces", async (req, res) => {
  try {
    const { user_id, name, visibility = "private", data = {} } = req.body || {};
    if (!user_id || !name) {
      res.status(400).json({ error: "user_id and name are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO workspaces (user_id, name, visibility, data)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, name, visibility, data]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create workspace" });
  }
});

app.patch("/api/workspaces/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};

    const fields = ["name", "visibility", "data"] as const;
    const assignments: string[] = [];
    const values: Array<unknown> = [];

    fields.forEach((field) => {
      if (field in updates) {
        values.push(updates[field]);
        assignments.push(`${field} = $${values.length}`);
      }
    });

    if (assignments.length === 0) {
      res.status(400).json({ error: "No updates provided" });
      return;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE workspaces SET ${assignments.join(", ")}
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update workspace" });
  }
});

app.delete("/api/workspaces/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM workspaces WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Workspace not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete workspace" });
  }
});

app.get("/api/friends/summary", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    const friendships = await pool.query(
      "SELECT * FROM friendships WHERE user_id = $1 OR friend_id = $1",
      [userId]
    );

    const friendIds = friendships.rows.map((row) =>
      row.user_id === userId ? row.friend_id : row.user_id
    );

    const friends = friendIds.length
      ? (
        await pool.query("SELECT * FROM profiles WHERE id = ANY($1)", [friendIds])
      ).rows
      : [];

    const received = await pool.query(
      "SELECT * FROM friend_requests WHERE receiver_id = $1 AND status = 'pending'",
      [userId]
    );

    const sent = await pool.query(
      "SELECT * FROM friend_requests WHERE sender_id = $1 AND status = 'pending'",
      [userId]
    );

    const senderIds = received.rows.map((row) => row.sender_id);
    const receiverIds = sent.rows.map((row) => row.receiver_id);

    const senderProfiles = senderIds.length
      ? (
        await pool.query("SELECT * FROM profiles WHERE id = ANY($1)", [senderIds])
      ).rows
      : [];
    const receiverProfiles = receiverIds.length
      ? (
        await pool.query("SELECT * FROM profiles WHERE id = ANY($1)", [receiverIds])
      ).rows
      : [];

    const pendingRequests = received.rows.map((row) => ({
      ...row,
      sender: senderProfiles.find((profile) => profile.id === row.sender_id),
    }));

    const sentRequests = sent.rows.map((row) => ({
      ...row,
      receiver: receiverProfiles.find((profile) => profile.id === row.receiver_id),
    }));

    res.json({ friends, pendingRequests, sentRequests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

app.post("/api/friend-requests", async (req, res) => {
  try {
    const { sender_id, receiver_id } = req.body || {};
    if (!sender_id || !receiver_id) {
      res.status(400).json({ error: "sender_id and receiver_id are required" });
      return;
    }

    const result = await pool.query(
      "INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES ($1, $2, 'pending') RETURNING *",
      [sender_id, receiver_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send friend request" });
  }
});

app.post("/api/friend-requests/:id/accept", async (req, res) => {
  try {
    const { id } = req.params;
    const requestResult = await pool.query(
      "SELECT * FROM friend_requests WHERE id = $1",
      [id]
    );

    if (requestResult.rows.length === 0) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = requestResult.rows[0];

    await pool.query(
      "UPDATE friend_requests SET status = 'accepted' WHERE id = $1",
      [id]
    );

    await pool.query(
      "INSERT INTO friendships (user_id, friend_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [request.sender_id, request.receiver_id]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to accept request" });
  }
});

app.post("/api/friend-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE friend_requests SET status = 'rejected' WHERE id = $1", [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to reject request" });
  }
});

app.delete("/api/friend-requests/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM friend_requests WHERE id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to cancel request" });
  }
});

app.delete("/api/friends", async (req, res) => {
  try {
    const userId = String(req.query.userId || "").trim();
    const friendId = String(req.query.friendId || "").trim();

    if (!userId || !friendId) {
      res.status(400).json({ error: "userId and friendId are required" });
      return;
    }

    await pool.query(
      "DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)",
      [userId, friendId]
    );

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
