# BankIQ

**AI-Powered Banking Knowledge Assistant**

BankIQ is a Retrieval-Augmented Generation (RAG) based banking chatbot designed to answer employee/customer banking questions using only information contained in approved banking documents.

The system supports document ingestion, parsing, chunking, embedding generation, semantic retrieval, and grounded answer generation. It also provides an authenticated admin dashboard for managing the knowledge base.

---

## Live Application

- **Frontend:** https://bank-iq-rose.vercel.app
- **Backend API:** https://bankiq-jkca.onrender.com
- **Health Check:** https://bankiq-jkca.onrender.com/health

---

## Architecture
<img width="1536" height="1024" alt="BankIQ-Architecture_diag" src="https://github.com/user-attachments/assets/5ce3f8b6-a53c-4180-991a-9f66df93a132" />


The system follows two main workflows:
1. **Admin Upload Flow**: Admin portal → Backend → Supabase storage → Gemini embeddings → Qdrant vector DB
2. **User Chat Flow**: User chat → Backend → Qdrant retrieval → Gemini LLM → Answer with sources

---

## Key Features

- **Customer Chatbot:** Natural-language banking questions with context-aware follow-up support and source references
- **Grounded RAG:** Answers generated only from retrieved banking documents with similarity filtering
- **Admin Dashboard:** Firebase-authenticated document upload/management (PDF, DOCX, XLSX, CSV)
- **Security:** Firebase Authentication, custom claims, and server-side credential storage

---

## Technology Stack

**Frontend:** React, Vite, JavaScript, Firebase Authentication  
**Backend:** Node.js, Express.js, JavaScript  
**AI/RAG:** Google Gemini API (Flash + gemini-embedding-001)  
**Vector DB:** Qdrant Cloud (3072-dim, cosine similarity)  
**Storage:** Supabase Storage, Firebase Authentication  
**Deployment:** Vercel (frontend), Render (backend)

---

## Project Structure

```
BankIQ/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/          # AdminDashboard, AdminLogin
│   │   └── firebase.js
│   └── package.json
├── server/          # Express backend
│   ├── config/      # Firebase Admin
│   ├── middleware/  # Auth middleware
│   ├── parsers/     # Document parsing
│   ├── routes/      # API routes
│   ├── services/    # Embedding, LLM, Qdrant, Supabase
│   └── utils/       # Text chunking
└── README.md
```

---

## Environment Variables

### Frontend (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### Backend (`server/.env`)
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_api_key
QDRANT_COLLECTION=banking_documents
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_supabase_secret_key
SUPABASE_BUCKET=banking-documents
CLIENT_URL=http://localhost:5173
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
```

**Never commit `.env` files or API keys to GitHub.**

---

## Installation

```bash
# Clone repository
git clone <your-github-repository-url>
cd BankIQ

# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install

# Configure environment variables
# Create client/.env and server/.env with variables above
```

---

## Run Locally

```bash
# Start backend (terminal 1)
cd server
node server.js
# Runs on http://localhost:5000

# Start frontend (terminal 2)
cd client
npm run dev
# Runs on http://localhost:5173
```

---

## Admin Setup

After creating a Firebase user, assign admin role:

```bash
cd server
node setAdmin.js
```

The backend verifies `req.user.admin === true` for protected operations.

---

## API Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Chat with RAG (requires `{ question, history }`)
- `GET /api/documents` - List documents (requires auth)
- `DELETE /api/documents/:documentId` - Delete document (requires auth)
- `POST /api/upload` - Upload documents (requires auth, multipart/form-data)

---

## Deployment

### Frontend (Vercel)
Set `VITE_API_URL=https://bankiq-jkca.onrender.com/api` and redeploy.

### Backend (Render)
Set `CLIENT_URL=https://bank-iq-rose.vercel.app` and ensure server listens on `process.env.PORT`.

---

## Security Notes

- Keep all API keys and credentials server-side
- Use Firebase ID tokens for protected API calls
- Restrict CORS to frontend origin in production
- Validate file types and sizes on upload
- Never commit `.env` files or credentials

---

## License

This project is intended as a software project / assessment application.
