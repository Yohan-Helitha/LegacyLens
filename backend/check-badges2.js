require('dotenv').config();
const { Client } = require('pg');

async function run() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    const ub = await client.query('SELECT b.badge_code, u.earned_at FROM user_badges u JOIN badges b ON u.badge_id = b.id WHERE u.user_id = 1 ORDER BY u.earned_at ASC');
    console.log("User 1 Badges:", ub.rows);
    
    await client.end();
}
run();
