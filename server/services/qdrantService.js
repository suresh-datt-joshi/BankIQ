const { QdrantClient } = require('@qdrant/js-client-rest');

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = process.env.QDRANT_COLLECTION || 'banking_documents';
const VECTOR_SIZE = 3072;

async function createCollection() {
  try {
    const collections = await client.getCollections();

    const exists = collections.collections.some(
      (collection) => collection.name === COLLECTION_NAME,
    );

    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: VECTOR_SIZE,
          distance: 'Cosine',
        },
      });

      await client.createPayloadIndex(COLLECTION_NAME, {
        field_name: 'documentId',
        field_schema: 'keyword',
        wait: true,
      });

      console.log(`Qdrant collection "${COLLECTION_NAME}" created`);
    } else {
      console.log(`Qdrant collection "${COLLECTION_NAME}" already exists`);
    }
  } catch (error) {
    console.error('Qdrant collection error:', error);
    throw error;
  }
}

// Delete all chunks belonging to one document

async function deleteDocumentChunks(documentId) {
  try {
    await client.delete(COLLECTION_NAME, {
      filter: {
        must: [
          {
            key: 'documentId',
            match: {
              value: documentId,
            },
          },
        ],
      },
      wait: true,
    });

    console.log(`Deleted existing chunks for document: ${documentId}`);
  } catch (error) {
    console.error('Error deleting document chunks:', error);
    throw error;
  }
}

// Store document chunks

async function upsertChunks(chunks) {
  const points = chunks.map((chunk) => ({
    id: chunk.id,

    vector: chunk.embedding,

    payload: {
      text: chunk.text,

      documentId: chunk.documentId,

      document: chunk.document,

      fileType: chunk.fileType,

      chunkIndex: chunk.chunkIndex,

      uploadedAt: chunk.uploadedAt,
    },
  }));

  await client.upsert(COLLECTION_NAME, {
    wait: true,
    points,
  });

  console.log(`${points.length} chunks stored in Qdrant`);
}

// Semantic search

async function searchSimilarChunks(
  queryVector,
  limit = 5,
  scoreThreshold = 0.6,
) {
  const response = await client.query(COLLECTION_NAME, {
    query: queryVector,
    limit,
    score_threshold: scoreThreshold,
    with_payload: true,
  });

  return response.points;
}

// Get all unique documents
async function getDocuments() {
  const documents = new Map();

  let offset = null;

  do {
    const response = await client.scroll(COLLECTION_NAME, {
      limit: 100,
      offset,
      with_payload: true,
      with_vector: false,
    });

    for (const point of response.points) {
      const payload = point.payload;

      if (!payload || !payload.documentId) {
        continue;
      }

      if (!documents.has(payload.documentId)) {
        documents.set(payload.documentId, {
          documentId: payload.documentId,
          document: payload.document,
          fileType: payload.fileType,
          uploadedAt: payload.uploadedAt,
          storagePath: payload.storagePath,
          chunks: 0,
        });
      }

      documents.get(payload.documentId).chunks += 1;
    }

    offset = response.next_page_offset;
  } while (offset !== null);

  return Array.from(documents.values());
}

async function getDocumentsByName(documentName) {
  const documents = [];

  let offset = null;

  do {
    const response = await client.scroll(COLLECTION_NAME, {
      limit: 100,
      offset,
      with_payload: true,
      with_vector: false,
    });

    for (const point of response.points) {
      const payload = point.payload;

      if (payload && payload.document === documentName && payload.documentId) {
        if (!documents.some((doc) => doc.documentId === payload.documentId)) {
          documents.push({
            documentId: payload.documentId,
            document: payload.document,
            storagePath: payload.storagePath,
          });
        }
      }
    }

    offset = response.next_page_offset;
  } while (offset !== null);

  return documents;
}

async function deleteDocument(documentId) {
  await client.delete(COLLECTION_NAME, {
    filter: {
      must: [
        {
          key: 'documentId',
          match: {
            value: documentId,
          },
        },
      ],
    },
    wait: true,
  });

  console.log(`Deleted document: ${documentId}`);
}

module.exports = {
  client,
  COLLECTION_NAME,
  createCollection,
  deleteDocumentChunks,
  upsertChunks,
  searchSimilarChunks,
  getDocuments,
  getDocumentsByName,
  deleteDocument,
};
