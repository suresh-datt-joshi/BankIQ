const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { parseDocument } = require('../parsers/documentParser');
const chunkText = require('../utils/chunkText');

const {
  verifyFirebaseToken,
  requireAdmin,
} = require('../middleware/authMiddleware');

const { generateEmbedding } = require('../services/embeddingService');

const {
  createCollection,
  upsertChunks,
  getDocumentsByName,
  deleteDocument,
} = require('../services/qdrantService');

const { uploadFile, deleteFile } = require('../services/supabaseService');

const router = express.Router();

// ============================================================
// Generate a valid UUID-style point ID
// ============================================================

function createPointId(documentId, chunkIndex) {
  const hash = crypto
    .createHash('sha256')
    .update(`${documentId}-${chunkIndex}`)
    .digest('hex');

  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

// ============================================================
// Generate document ID using SHA-256
// ============================================================

function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);

  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

// ============================================================
// Multer configuration
// ============================================================

const upload = multer({
  dest: 'uploads/',

  limits: {
    files: 10,
    fileSize: 20 * 1024 * 1024, // 20 MB per file
  },

  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.xlsx', '.csv'];

    const extension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${extension}. Allowed: PDF, DOCX, XLSX, CSV`,
        ),
      );
    }
  },
});

// ============================================================
// Upload and index documents
// ============================================================

router.post(
  '/',
  verifyFirebaseToken,
  requireAdmin,
  upload.array('documents', 10),

  async (req, res) => {
    const uploadedStorageFiles = [];

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'Please upload at least one document.',
        });
      }

      // --------------------------------------------------------
      // Make sure Qdrant collection exists
      // --------------------------------------------------------

      await createCollection();

      // --------------------------------------------------------
      // Store all chunks from all documents
      // --------------------------------------------------------

      const allChunkData = [];

      const uploadedFiles = [];

      // --------------------------------------------------------
      // Store old document IDs that need replacement
      // --------------------------------------------------------

      const documentsToReplace = [];

      // --------------------------------------------------------
      // Store Supabase paths that were uploaded
      // --------------------------------------------------------

      const uploadedStorageFiles = [];

      // ========================================================
      // Process each uploaded file
      // ========================================================

      for (const file of req.files) {
        console.log('\n========================================');
        console.log(`Processing: ${file.originalname}`);
        console.log('========================================');

        // ------------------------------------------------------
        // Generate SHA-256 document ID
        // ------------------------------------------------------

        const documentId = generateFileHash(file.path);

        console.log('Document ID:', documentId);

        // ------------------------------------------------------
        // Check whether this filename already exists
        // ------------------------------------------------------

        const existingDocuments = await getDocumentsByName(file.originalname);

        console.log(`Existing versions found: ${existingDocuments.length}`);

        // ------------------------------------------------------
        // Mark old versions for replacement
        // ------------------------------------------------------

        for (const existingDocument of existingDocuments) {
          if (existingDocument.documentId !== documentId) {
            documentsToReplace.push(existingDocument.documentId);
          }
        }

        // ------------------------------------------------------
        // Upload original file to Supabase
        // ------------------------------------------------------

        const extension = path.extname(file.originalname).toLowerCase();

        const storagePath = `${documentId}/${file.originalname}`;

        console.log(`Uploading original file to Supabase: ${storagePath}`);

        await uploadFile(file.path, storagePath, file.mimetype);

        console.log('Original file stored in Supabase successfully.');

        // Keep track so we can clean it up if processing fails
        uploadedStorageFiles.push(storagePath);

        // ------------------------------------------------------
        // Extract text
        // ------------------------------------------------------

        const extractedText = await parseDocument(file.path, file.originalname);

        // ------------------------------------------------------
        // Clean extracted text
        // ------------------------------------------------------

        const cleanedText = extractedText.replace(/\s+/g, ' ').trim();

        console.log(`Extracted characters: ${cleanedText.length}`);

        // ------------------------------------------------------
        // Make sure document contains enough text
        // ------------------------------------------------------

        if (cleanedText.length < 50) {
          throw new Error(
            `"${file.originalname}" does not contain enough readable text.`,
          );
        }

        // ------------------------------------------------------
        // Create chunks
        // ------------------------------------------------------

        const chunks = chunkText(cleanedText);

        console.log(`Number of chunks: ${chunks.length}`);

        // ------------------------------------------------------
        // Make sure usable chunks were created
        // ------------------------------------------------------

        if (chunks.length === 0) {
          throw new Error(
            `"${file.originalname}" could not be divided into usable chunks.`,
          );
        }

        // ------------------------------------------------------
        // Upload timestamp
        // ------------------------------------------------------

        const uploadedAt = new Date().toISOString();

        // ------------------------------------------------------
        // Generate embeddings
        // ------------------------------------------------------

        for (let i = 0; i < chunks.length; i++) {
          console.log(
            `Embedding ${i + 1}/${chunks.length} - ${file.originalname}`,
          );

          const embedding = await generateEmbedding(chunks[i]);

          // ----------------------------------------------------
          // Store chunk metadata
          // ----------------------------------------------------

          allChunkData.push({
            id: createPointId(documentId, i),

            text: chunks[i],

            embedding: embedding,

            documentId: documentId,

            document: file.originalname,

            fileType: extension,

            chunkIndex: i,

            uploadedAt: uploadedAt,

            storagePath: storagePath,
          });
        }

        // ------------------------------------------------------
        // Add document information to response
        // ------------------------------------------------------

        uploadedFiles.push({
          documentId: documentId,

          filename: file.originalname,

          extension: extension,

          characters: cleanedText.length,

          chunks: chunks.length,

          uploadedAt: uploadedAt,

          storagePath: storagePath,
        });

        // ------------------------------------------------------
        // Remove temporary local file
        // ------------------------------------------------------

        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);

          console.log(`Temporary file deleted: ${file.path}`);
        }
      }

      // ========================================================
      // Store NEW document chunks first
      // ========================================================

      console.log(`\nStoring ${allChunkData.length} chunks in Qdrant...`);

      await upsertChunks(allChunkData);

      // ========================================================
      // Delete OLD document versions
      // ========================================================

      console.log(`Documents to replace: ${documentsToReplace.length}`);

      for (const oldDocumentId of documentsToReplace) {
        console.log(`Deleting old document: ${oldDocumentId}`);

        await deleteDocument(oldDocumentId);
      }

      // ========================================================
      // Success response
      // ========================================================

      res.json({
        message: 'Documents uploaded and indexed successfully',

        count: req.files.length,

        totalChunks: allChunkData.length,

        files: uploadedFiles,
      });
    } catch (error) {
      console.error('\nDocument processing error:', error);

      // ========================================================
      // Clean up temporary local files
      // ========================================================

      if (req.files) {
        for (const file of req.files) {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (cleanupError) {
            console.error(
              'Failed to remove temporary file:',
              cleanupError.message,
            );
          }
        }
      }

      // ========================================================
      // Clean up Supabase files uploaded during this request
      // ========================================================

      for (const storagePath of uploadedStorageFiles) {
        try {
          console.log(`Removing Supabase file after failure: ${storagePath}`);

          await deleteFile(storagePath);
        } catch (supabaseCleanupError) {
          console.error(
            'Failed to remove Supabase file:',
            supabaseCleanupError.message,
          );
        }
      }

      // ========================================================
      // Return error
      // ========================================================

      res.status(400).json({
        error: 'Failed to process documents',

        details: error.message,
      });
    }
  },
);

module.exports = router;
