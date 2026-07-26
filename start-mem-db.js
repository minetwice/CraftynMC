const { MongoMemoryServer } = require('mongodb-memory-server');

async function main() {
  console.log("Starting in-memory MongoDB server...");
  const mongod = await MongoMemoryServer.create({
    binary: {
      version: '6.0.14',
    }
  });
  const uri = mongod.getUri();
  console.log(`In-memory MongoDB started at: ${uri}`);

  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "test_jwt_secret_key_123456";
  process.env.PUBLIC_BASE_URL = "http://localhost:3000";
  process.env.PORT = "3000";
  process.env.SERVER_NAME = "FearLauncher Network";

  console.log("Starting FearLauncher Skinserver...");

  // Require the main server index file directly to run in the same process
  require('./src/index.js');
}

main().catch(err => {
  console.error("Failed to start with memory db:", err);
  process.exit(1);
});
