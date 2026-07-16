const bcrypt = require('bcrypt');

async function generateHashes() {
  const saltRounds = 10;
  
  const users = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'waiter1', password: 'waiter123', role: 'waiter' },
    { username: 'cook1', password: 'cook123', role: 'cook' }
  ];

  console.log('Generating password hashes...');
  console.log('Copy these into your server.js users array:\n');

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    console.log(`  {`);
    console.log(`    username: '${user.username}',`);
    console.log(`    password: '${hashedPassword}',`);
    console.log(`    role: '${user.role}'`);
    console.log(`  },`);
  }
}

generateHashes().catch(console.error);
