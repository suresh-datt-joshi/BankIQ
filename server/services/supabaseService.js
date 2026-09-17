const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const BUCKET = process.env.SUPABASE_BUCKET || 'banking-documents';

async function uploadFile(filePath, storagePath, contentType) {
  const fs = require('fs');

  const fileBuffer = fs.readFileSync(filePath);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return data;
}

async function downloadFile(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath);

  if (error) {
    throw error;
  }

  return data;
}

async function deleteFile(storagePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath]);

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  BUCKET,
};
