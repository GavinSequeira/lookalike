
import { MongoClient } from 'mongodb';

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'lookalike';

const client = new MongoClient(URI);

async function main() {
  try {
    await client.connect();

    const db = client.db(DB_NAME);
    const shoes = await db.collection('shoes').find({}).toArray();

    const withImages = shoes.filter(
      shoe => typeof shoe.imageUrl === 'string' &&
        shoe.imageUrl.startsWith('http')
    );

    console.log('MongoDB connected:', DB_NAME);
    console.log('Total shoes:', shoes.length);
    console.log('Shoes with image URLs:', withImages.length);
    console.log('Shoes missing images:', shoes.length - withImages.length);

    console.log('\nFirst shoe sample:');
    console.log(JSON.stringify(shoes[0] ?? null, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
