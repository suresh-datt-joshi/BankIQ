const { auth } = require('./config/firebaseAdmin');

async function setAdmin() {
  try {
    // Use the email of your Firebase admin account
    const adminEmail = 'admin@bankiq.com';

    const user = await auth.getUserByEmail(adminEmail);

    await auth.setCustomUserClaims(user.uid, {
      admin: true,
    });

    console.log(`Admin role assigned successfully to: ${adminEmail}`);

    console.log('UID:', user.uid);

    process.exit(0);
  } catch (error) {
    console.error('Failed to assign admin role:', error);

    process.exit(1);
  }
}

setAdmin();
