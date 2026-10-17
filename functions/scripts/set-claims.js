#!/usr/bin/env node
/**
 * Bootstrap claim Firebase Auth untuk CafeQR.
 *
 * Dipakai untuk pengaturan awal (di luar UI), karena hanya reseller yang
 * boleh menetapkan claim admin dari dalam aplikasi.
 *
 * Pemakaian (butuh service account: `gcloud auth application-default login`
 * atau set GOOGLE_APPLICATION_CREDENTIALS):
 *
 *   node functions/scripts/set-claims.js reseller admin@example.com
 *   node functions/scripts/set-claims.js admin admin@example.com kopi-senja
 *   node functions/scripts/set-claims.js admin-off admin@example.com kopi-senja
 *
 * Argumen:
 *   1) aksi: reseller | admin | admin-off
 *   2) email user
 *   3) slug (khusus aksi admin/admin-off)
 */

const admin = require('firebase-admin');

async function main() {
  const [action, email, slug] = process.argv.slice(2);

  if (!action || !email) {
    console.error(
      'Pemakaian: node functions/scripts/set-claims.js <reseller|admin|admin-off> <email> [slug]',
    );
    process.exit(1);
  }

  admin.initializeApp();
  const user = await admin.auth().getUserByEmail(email);
  const existing = user.customClaims || {};

  let claims;
  if (action === 'reseller') {
    claims = { ...existing, reseller: true };
  } else if (action === 'admin' || action === 'admin-off') {
    if (!slug) {
      console.error('Aksi admin/admin-off membutuhkan slug.');
      process.exit(1);
    }
    claims = { ...existing, [`admin_${slug}`]: action === 'admin' };
    if (action === 'admin') claims.slug = slug;
  } else {
    console.error(`Aksi tidak dikenal: ${action}`);
    process.exit(1);
  }

  await admin.auth().setCustomUserClaims(user.uid, claims);
  console.log(`✔ Claim diperbarui untuk ${email}:`, claims);
  console.log('  (User perlu logout/login ulang agar token memuat claim baru.)');
}

main().catch((err) => {
  console.error('Gagal mengatur claim:', err.message);
  process.exit(1);
});
