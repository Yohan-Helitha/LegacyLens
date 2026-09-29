require('dotenv').config();
const { Client } = require('pg');

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const ub = await client.query('SELECT b.badge_code, u.earned_at FROM user_badges u JOIN badges b ON u.badge_id = b.id');
    console.log("User Badges:", ub.rows);
    
    const quests = await client.query('SELECT q.id, q.title, b.badge_code FROM quests q JOIN landmarks l ON q.landmark_id = l.id JOIN badges b ON b.landmark_id = l.id ORDER BY q.id ASC');
    console.log("Quests sorted by ID:", quests.rows);
    
    await client.end();
}
run();
