import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/agentpay';
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const conn = await clientPromise;
  return conn.db();
}

export default clientPromise;
