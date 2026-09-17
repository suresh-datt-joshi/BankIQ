# BankIQ

BankIQ is a document-grounded banking assistant. Users can ask questions about
indexed banking documents through a React chat interface, while authenticated
administrators can upload, replace, and delete the documents used by the
assistant.

The application is split into:

- **Client:** React 19, Vite, React Router, Axios, and Firebase Authentication.
- **Server:** Node.js, Express, Google Gemini, Qdrant, Supabase Storage, and
  Firebase Admin.

## Features

- Conversational banking Q&A grounded in uploaded documents.
- Search-query rewriting for follow-up questions.
- Retrieval of relevant document chunks from Qdrant.
- Gemini-generated answers with document source metadata.
- Admin-only document management.
- Upload support for PDF, DOCX, XLSX, and CSV files.
- Multiple-file uploads, with a maximum of 10 files per request and 20 MB per
  file.

## Project structure

```text
BankIQ/
├── client/                 # React/Vite frontend
│   ├── public/              # Static assets
│   └── src/
│       ├── components/      # Shared React components
│       └── pages/           # Chatbot and admin pages
├── server/                 # Express backend
│   ├── config/              # Firebase Admin configuration
│   ├── middleware/          # Authentication and authorization
│   ├── parsers/             # Uploaded document parsers
│   ├── routes/              # Chat, upload, and document APIs
│   ├── services/            # Gemini, embeddings, Qdrant, and Supabase
│   └── utils/               # Shared server utilities
└── README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- A Firebase project with Email/Password Authentication enabled
- A Firebase service-account JSON file
- A Gemini API key
- A running Qdrant instance
- A Supabase project with a Storage bucket

## Installation

Install dependencies for both applications:

```powershell
cd server
npm install

cd ..\client
npm install
```

The root `package.json` is not the application entry point; run the client and
server commands from their respective directories.

## Configuration

### Server environment variables

Create `server/.env`:

```dotenv
PORT=5000
GEMINI_API_KEY=your_gemini_api_key

QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=banking_documents

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_server_key
SUPABASE_BUCKET=banking-documents
```

Keep this file private. Do not commit API keys, Supabase secret keys, or service
account credentials.

### Firebase Admin credentials

Place the Firebase Admin SDK service-account file at:

```text
server/serviceAccountKey.json
```

The server loads this exact filename from `server/config/firebaseAdmin.js`.
Download the file from **Firebase Console > Project settings > Service
accounts > Generate new private key**. Never expose this file in the frontend
or commit it to source control.

### Firebase client configuration

The frontend Firebase project configuration is in
`client/src/firebase.js`. Update it when connecting the application to a
different Firebase project. Enable Email/Password sign-in in Firebase
Authentication and create the administrator account there.

## Running locally

Start Qdrant first. For example, with Docker:

```powershell
docker run --name bankiq-qdrant -p 6333:6333 -p 6334:6334 `
  qdrant/qdrant
```

Start the API server in one terminal:

```powershell
cd server
node server.js
```

The API will be available at `http://localhost:5000`.

Start the frontend in a second terminal:

```powershell
cd client
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

The client currently sends API requests to `http://localhost:5000/api`.

## Admin setup

1. Create an administrator user in Firebase Authentication.
2. Update the email in `server/setAdmin.js` to that Firebase user's email.
3. Run the script from the server directory:

   ```powershell
   cd server
   node setAdmin.js
   ```

4. Open `/admin` in the frontend and sign in.
5. Use `/admin/dashboard` to upload and manage source documents.

The backend requires a valid Firebase ID token and the custom `admin: true`
claim for document listing, upload, and deletion.

## API endpoints

| Method | Endpoint | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/` | None | API status check |
| `POST` | `/api/chat` | None | Answer a question using indexed documents |
| `POST` | `/api/upload` | Firebase admin | Upload and index documents |
| `GET` | `/api/documents` | Firebase admin | List indexed documents |
| `DELETE` | `/api/documents/:documentId` | Firebase admin | Delete a document and its stored chunks |

For uploads, send files as multipart form-data using the `documents` field.
Supported extensions are `.pdf`, `.docx`, `.xlsx`, and `.csv`.

Example chat request:

```powershell
Invoke-RestMethod `
  -Uri http://localhost:5000/api/chat `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"question":"What documents are available?"}'
```

## Available scripts

### Client

Run these commands from `client/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Server

Run these commands from `server/`:

| Command | Description |
| --- | --- |
| `node server.js` | Start the Express API |
| `node setAdmin.js` | Assign the admin custom claim to the configured Firebase user |
| `node testQdrant.js` | Verify Qdrant connectivity and collection configuration |
| `node testEmbedding.js` | Verify embedding generation |

## Troubleshooting

- **Authentication errors:** Confirm Firebase Email/Password sign-in is
  enabled, the user exists, and `node setAdmin.js` has been run for that user.
- **Qdrant errors:** Confirm Qdrant is running on the URL in `QDRANT_URL`.
- **Gemini errors:** Check that `GEMINI_API_KEY` is present and valid.
- **Storage errors:** Check the Supabase URL, server key, bucket name, and
  bucket permissions.
- **Frontend API errors:** Confirm the server is running on port 5000, or
  update the API URL constants in the client pages.

## Security notes

- Treat `server/.env` and `server/serviceAccountKey.json` as secrets.
- Use a server-side Supabase key only in the backend.
- Do not use production credentials in local development.
- Restrict Firebase administrator access to trusted users.
- Configure CORS and HTTPS appropriately before deploying publicly.