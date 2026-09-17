
function chunkText(text, maxChunkSize = 700, overlap = 100) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = [];

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If the paragraph fits into the current chunk
    if (currentChunk.length + paragraph.length + 1 <= maxChunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;

      continue;
    }

    // Save the current chunk
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // If the paragraph itself is small enough,
    // start a new chunk with it.
    if (paragraph.length <= maxChunkSize) {
      currentChunk = paragraph;
      continue;
    }

    // Handle very large paragraphs
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];

    currentChunk = '';

    for (const sentence of sentences) {
      const cleanSentence = sentence.trim();

      if (!cleanSentence) {
        continue;
      }

      if (currentChunk.length + cleanSentence.length + 1 <= maxChunkSize) {
        currentChunk += (currentChunk ? ' ' : '') + cleanSentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        currentChunk = cleanSentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  // Add controlled overlap between chunks
  const finalChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i];

    if (i > 0 && overlap > 0) {
      const previousChunk = chunks[i - 1];

      const overlapText = previousChunk.slice(-overlap);

      chunk = `${overlapText}\n\n${chunk}`;
    }

    finalChunks.push(chunk.trim());
  }

  return finalChunks;
}

module.exports = chunkText;
