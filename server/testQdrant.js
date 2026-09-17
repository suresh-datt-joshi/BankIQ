require('dotenv').config();

const {
  createCollection,
  client,
  COLLECTION_NAME,
} = require('./services/qdrantService');

async function test() {
  try {
    await createCollection();

    const info = await client.getCollection(COLLECTION_NAME);

    console.log('Qdrant is working!');
    console.log('Collection:', COLLECTION_NAME);
    console.log('Vector size:', info.config.params.vectors.size);
  } catch (error) {
    console.error('Qdrant error:', error);
  }
}

test();
