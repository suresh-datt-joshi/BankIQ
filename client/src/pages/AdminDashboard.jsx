import { useEffect, useState } from 'react';
import axios from 'axios';
import { signOut, getIdToken } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function AdminDashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  // ===============================
  // LOAD DOCUMENTS
  // ===============================

  const loadDocuments = async () => {
    try {
      setLoading(true);

      if (!auth.currentUser) {
        console.error('No authenticated admin user.');
        return;
      }

      const token = await getIdToken(auth.currentUser);

      const response = await axios.get(`${API_URL}/documents`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        await signOut(auth);
        navigate('/admin', {
          replace: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // FILE SELECTION
  // ===============================

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    setFiles(selectedFiles);
    setUploadMessage('');
  };

  // ===============================
  // UPLOAD DOCUMENTS
  // ===============================

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadMessage('Please select at least one file.');
      return;
    }

    try {
      setUploading(true);
      setUploadMessage('');

      if (!auth.currentUser) {
        setUploadMessage('You must be logged in as an admin.');
        return;
      }

      const token = await getIdToken(auth.currentUser);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append('documents', file);
      });

      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadMessage(
        response.data.message ||
          `${response.data.count || files.length} document(s) indexed successfully.`,
      );

      setFiles([]);

      const fileInput = document.getElementById('document-upload');

      if (fileInput) {
        fileInput.value = '';
      }

      await loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        await signOut(auth);

        navigate('/admin', {
          replace: true,
        });

        return;
      }

      setUploadMessage(
        error.response?.data?.error || 'Failed to upload documents.',
      );
    } finally {
      setUploading(false);
    }
  };

  // ===============================
  // DELETE DOCUMENT
  // ===============================

  const handleDelete = async (documentId, documentName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${documentName}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(documentId);

      if (!auth.currentUser) {
        alert('You must be logged in as an admin.');
        return;
      }

      const token = await getIdToken(auth.currentUser);

      await axios.delete(`${API_URL}/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from UI immediately
      setDocuments((previousDocuments) =>
        previousDocuments.filter(
          (document) => document.documentId !== documentId,
        ),
      );
    } catch (error) {
      console.error('Delete error:', error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        await signOut(auth);

        navigate('/admin', {
          replace: true,
        });

        return;
      }

      alert(error.response?.data?.error || 'Failed to delete document.');
    } finally {
      setDeletingId(null);
    }
  };

  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = async () => {
    try {
      await signOut(auth);

      window.location.href = '/admin';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ===============================
  // INITIAL LOAD
  // ===============================

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <div className="admin-page">
      {/* =========================
          HEADER
      ========================== */}

      <header className="admin-header">
        <div>
          <h1>BankIQ Admin</h1>

          <p>Knowledge Base Management</p>
        </div>

        <button onClick={handleLogout}>Logout</button>
      </header>

      <main className="admin-content">
        {/* =========================
            UPLOAD SECTION
        ========================== */}

        <section className="upload-section">
          <h2>Upload Documents</h2>

          <p>
            Upload banking documents to add them to the BankIQ knowledge base.
          </p>

          <div className="upload-area">
            <input
              id="document-upload"
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.csv"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <p>Supported formats: PDF, DOCX, XLSX, CSV</p>

            <p>Maximum 10 files per upload</p>
          </div>

          {/* Selected Files */}

          {files.length > 0 && (
            <div className="selected-files">
              <h3>Selected Documents</h3>

              {files.map((file, index) => (
                <div className="file-item" key={`${file.name}-${index}`}>
                  <span>📄</span>

                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}

          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? 'Processing documents...' : 'Upload & Index Documents'}
          </button>

          {uploadMessage && <p className="upload-message">{uploadMessage}</p>}
        </section>

        {/* =========================
            KNOWLEDGE BASE
        ========================== */}

        <section className="documents-card">
          <div className="documents-header">
            <div>
              <h2>Knowledge Base</h2>

              <p>Documents currently available to BankIQ.</p>
            </div>

            <button
              className="refresh-button"
              onClick={loadDocuments}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Loading */}

          {loading ? (
            <div className="no-documents">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="no-documents">
              No documents have been indexed yet.
            </div>
          ) : (
            <div className="documents-list">
              {documents.map((document) => (
                <div className="document-row" key={document.documentId}>
                  {/* File Icon */}

                  <div className="document-icon">
                    {document.fileType === '.pdf'
                      ? '📕'
                      : document.fileType === '.docx'
                        ? '📝'
                        : document.fileType === '.xlsx'
                          ? '📊'
                          : '📋'}
                  </div>

                  {/* Document Information */}

                  <div className="document-info">
                    <strong>{document.document}</strong>

                    <span>
                      {document.fileType.toUpperCase()}
                      {' • '}
                      {document.chunks} chunk
                      {document.chunks !== 1 ? 's' : ''}
                    </span>

                    {document.uploadedAt && (
                      <span>
                        Uploaded:{' '}
                        {new Date(document.uploadedAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Delete */}

                  <button
                    className="delete-button"
                    onClick={() =>
                      handleDelete(document.documentId, document.document)
                    }
                    disabled={deletingId === document.documentId}
                  >
                    {deletingId === document.documentId
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
