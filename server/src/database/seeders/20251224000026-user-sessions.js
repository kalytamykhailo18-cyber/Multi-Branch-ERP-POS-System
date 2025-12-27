'use strict';
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

module.exports = {
  async up(queryInterface) {
    // Get users
    const [users] = await queryInterface.sequelize.query(
      `SELECT u.id, u.email FROM users u;`
    );

    // Get branches
    const [branches] = await queryInterface.sequelize.query(
      `SELECT id, code FROM branches;`
    );

    if (users.length === 0 || branches.length === 0) {
      console.log('No users or branches found, skipping user_sessions seeder');
      return;
    }

    const sessions = [];
    const now = new Date();

    // Create active sessions for each user
    users.forEach((user, idx) => {
      // Get branch for this user (rotate through branches)
      const branch = branches[idx % branches.length];

      // Create an active session
      const expiresAt = new Date(now);
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

      sessions.push({
        id: uuidv4(),
        user_id: user.id,
        token_hash: crypto.randomBytes(32).toString('hex'),
        device_info: idx % 2 === 0 ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0' : 'Mozilla/5.0 (Linux; Android 13) Mobile',
        ip_address: `192.168.1.${100 + idx}`,
        branch_id: branch.id,
        expires_at: expiresAt,
        revoked_at: null,
        created_at: now
      });

      // Create an expired session for some users
      if (idx < 3) {
        const expiredDate = new Date(now);
        expiredDate.setDate(expiredDate.getDate() - 2);
        const expiredExpires = new Date(expiredDate);
        expiredExpires.setHours(expiredExpires.getHours() + 8);

        sessions.push({
          id: uuidv4(),
          user_id: user.id,
          token_hash: crypto.randomBytes(32).toString('hex'),
          device_info: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0',
          ip_address: `192.168.1.${150 + idx}`,
          branch_id: branch.id,
          expires_at: expiredExpires,
          revoked_at: expiredExpires, // Session was revoked when expired
          created_at: expiredDate
        });
      }
    });

    await queryInterface.bulkInsert('user_sessions', sessions);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user_sessions', null, {});
  }
};
