import { MongoClient, Db, Collection } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set')
  }
  const dbName = process.env.MONGODB_DB || 'revent'

  if (cachedClient && cachedDb) return cachedDb

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db(dbName)

  cachedClient = client
  cachedDb = db
  return db
}

//@ts-expect-error Document not yet known
export async function getCollection<T>(name: string): Promise<Collection<T>> {
  const db = await getMongoDb()
  //@ts-expect-error Collection not yet known
  return db.collection<T>(name)
}


