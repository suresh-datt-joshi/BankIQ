const express = require('express');
const {createCollection, getDocuments, deleteDocument } = require('../services/qdrantService');
const { deleteFile } = require('../services/supabaseService');

const {
  verifyFirebaseToken,
  requireAdmin,
} = require('../middleware/authMiddleware');
const router = express.Router();

// GET all documents
// Protected: Admin only
router.get('/', verifyFirebaseToken, requireAdmin, async (req, res) => {
  try {
    
    await createCollection();
    const documents = await getDocuments();

    res.json({
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error('Failed to get documents:', error);

    res.status(500).json({
      error: 'Failed to retrieve documents',
      details: error.message,
    });
  }
});

// DELETE a document
// Protected: Admin only
router.delete(
  '/:documentId',
  verifyFirebaseToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { documentId } = req.params;

      if (!documentId || documentId.trim() === '') {
        return res.status(400).json({
          error: 'Document ID is required.',
        });
      }

      console.log(`Deleting document: ${documentId}`);

      // --------------------------------------------------
      // Find document information
      // --------------------------------------------------

      const documents = await getDocuments();

      const document = documents.find((item) => item.documentId === documentId);

      if (!document) {
        return res.status(404).json({
          error: 'Document not found.',
        });
      }

      // --------------------------------------------------
      // Delete from Qdrant
      // --------------------------------------------------

      await deleteDocument(documentId);

      console.log(`Deleted document chunks from Qdrant: ${documentId}`);

      // --------------------------------------------------
      // Delete original file from Supabase
      // --------------------------------------------------

      const storagePath =
        document.storagePath || `${document.documentId}/${document.document}`;

      console.log(`Deleting original file from Supabase: ${storagePath}`);

      await deleteFile(storagePath);

      console.log('Original file deleted from Supabase.');

      // --------------------------------------------------
      // Success
      // --------------------------------------------------

      res.json({
        message: 'Document deleted successfully.',
        documentId,
      });
    } catch (error) {
      console.error('Failed to delete document:', error);

      res.status(500).json({
        error: 'Failed to delete document',
        details: error.message,
      });
    }
  },
);

module.exports = router;
