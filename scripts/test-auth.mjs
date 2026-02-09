import { Pool } from "pg";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

async function testSignUp() {
    try {
        const email = "test@example.com";
        const password = "password123";
        const displayName = "Test User";
        const userId = crypto.randomUUID();
        const passwordHash = hashPassword(password);

        // Clear any existing test users
        await pool.query("DELETE FROM auth_users WHERE email = $1", [email]);

        // Create user
        const result = await pool.query(
            `INSERT INTO auth_users (id, email, password_hash, name) 
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [userId, email, passwordHash, displayName]
        );

        console.log("✓ User created:", result.rows[0]);

        // Now try to authenticate
        const verifyResult = await pool.query(
            "SELECT id, email, name, password_hash FROM auth_users WHERE email = $1",
            [email]
        );

        if (verifyResult.rows.length === 0) {
            console.log("✗ User not found");
            return;
        }

        const user = verifyResult.rows[0];
        const incomingPasswordHash = hashPassword(password);

        console.log("Stored hash:  ", user.password_hash);
        console.log("Incoming hash:", incomingPasswordHash);
        console.log("Match:", user.password_hash === incomingPasswordHash);

        if (user.password_hash === incomingPasswordHash) {
            console.log("✓ Authentication successful");
        } else {
            console.log("✗ Authentication failed - password mismatch");
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await pool.end();
    }
}

testSignUp();
