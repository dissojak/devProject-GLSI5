// Temporary diagnostic - run from backend/:  node --env-file=.env test-db.cjs
// Prints the REAL connection error (Mongoose hides it behind "buffering timed out").
// Never prints the password. Delete this file afterwards.
const dns = require('node:dns/promises');
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

async function checkDns(host) {
  try {
    const records = await dns.resolveSrv(`_mongodb._tcp.${host}`);
    console.log(`DNS SRV     : OK (${records.length} servers)`);
  } catch (error) {
    console.log(`DNS SRV     : FAILED (${error.code})`);
  }
}

async function checkConnection() {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log(`Connection  : OK (database: ${mongoose.connection.name})`);
  } catch (error) {
    console.log(`Connection  : FAILED - ${error.message}`);
  }
}

async function main() {
  if (!uri) {
    console.log('MONGODB_URI is empty: .env is not read or the variable name is wrong');
    return;
  }

  const host = uri.split('@')[1]?.split(/[/?]/)[0];

  console.log(`Host        : ${host}`);

  if (uri.startsWith('mongodb+srv://')) {
    await checkDns(host);
  }

  await checkConnection();
  await mongoose.disconnect();
}

main();
