const express = require('express');

const { generateEmbedding } = require('../services/embeddingService');

const { searchSimilarChunks } = require('../services/qdrantService');

const {
  generateSearchQuery,
  generateAnswer,
} = require('../services/llmService');

const router = express.Router();

// --------------------------------------------------
// Split compound questions into smaller questions
// --------------------------------------------------

function splitQuestion(question) {
  const trimmedQuestion = question.trim();

  // Detect "and" followed by another question-style phrase.
  //
  // Example:
  // "What is the minimum age and what is the processing fee?"
  //
  // becomes:
  // "What is the minimum age"
  // "what is the processing fee?"

  const parts = trimmedQuestion.split(
    /\s+and\s+(?=(?:what|which|how|when|where|why|who|is|are|can|do|does)\b)/i,
  );

  return parts.map((part) => part.trim()).filter(Boolean);
}

// --------------------------------------------------
// Chat endpoint
// --------------------------------------------------

router.post('/', async (req, res) => {
  try {
    const { question, history = [] } = req.body;

    // --------------------------------------------------
    // 1. Validate question
    // --------------------------------------------------

    if (!question || question.trim() === '') {
      return res.status(400).json({
        error: 'Please provide a question.',
      });
    }

    const cleanQuestion = question.trim();
    const searchQuery = await generateSearchQuery(cleanQuestion, history);
    console.log('\nSearch query:', searchQuery);

    console.log('\n==============================');
    console.log('Question:', cleanQuestion);
    console.log('==============================');

    // --------------------------------------------------
    // 2. Split compound question
    // --------------------------------------------------

    const subQuestions = splitQuestion(searchQuery);
    console.log('\nSub-questions:');

    subQuestions.forEach((subQuestion, index) => {
      console.log(`${index + 1}. ${subQuestion}`);
    });

    // --------------------------------------------------
    // 3. Search using the FULL original question
    // --------------------------------------------------

    const allResults = [];

    console.log(`\nSearching full question: "${cleanQuestion}"`);

    const fullQuestionEmbedding = await generateEmbedding(searchQuery);

    console.log('Full question embedding generated');

    const fullResults = await searchSimilarChunks(
      fullQuestionEmbedding,
      5,
      0.5,
    );

    console.log(`Full question results: ${fullResults.length}`);

    allResults.push(...fullResults);

    // --------------------------------------------------
    // 4. Search using each sub-question
    // --------------------------------------------------

    for (const subQuestion of subQuestions) {
      console.log(`\nSearching sub-question: "${subQuestion}"`);

      const subQuestionEmbedding = await generateEmbedding(subQuestion);

      console.log('Sub-question embedding generated');

      const results = await searchSimilarChunks(subQuestionEmbedding, 5, 0.5);

      console.log(`Sub-question results: ${results.length}`);

      allResults.push(...results);
    }

    // --------------------------------------------------
    // 5. Remove duplicate chunks
    // --------------------------------------------------

    const uniqueResults = new Map();

    for (const result of allResults) {
      const resultId = String(result.id);

      const existing = uniqueResults.get(resultId);

      // If the same chunk was retrieved multiple
      // times, keep the version with the highest score.

      if (!existing || result.score > existing.score) {
        uniqueResults.set(resultId, result);
      }
    }

    // --------------------------------------------------
    // 6. Sort by similarity score
    // --------------------------------------------------

    const finalResults = Array.from(uniqueResults.values())
      .sort((a, b) => b.score - a.score)
      .filter((result) => result.score >= 0.55)
      .slice(0, 2);

    // --------------------------------------------------
    // 7. Log final retrieval results
    // --------------------------------------------------
    console.log('\n================================');

    console.log('Final evidence selected:');

    console.log('================================');

    finalResults.forEach((result, index) => {
      console.log(
        `${index + 1}. ` +
          `${result.payload.document} | ` +
          `Chunk: ${result.payload.chunkIndex} | ` +
          `Score: ${result.score}`,
      );
    });
    // --------------------------------------------------
    // 8. No relevant information found
    // --------------------------------------------------

    if (finalResults.length === 0) {
      return res.json({
        answer:
          "I couldn't find this information in the available banking documents.",
        sources: [],
      });
    }

    // --------------------------------------------------
    // 9. Build context for Gemini
    // --------------------------------------------------

    const context = finalResults
      .map((result, index) => {
        return `
SOURCE ${index + 1}

Document: ${result.payload.document}
File Type: ${result.payload.fileType}
Chunk: ${result.payload.chunkIndex}
Similarity Score: ${result.score}

Content:
${result.payload.text}
`;
      })
      .join('\n');

    console.log('\n================================');

    console.log('Context sent to Gemini:');

    console.log('================================');

    console.log(context);

    // --------------------------------------------------
    // 10. Generate grounded answer
    // --------------------------------------------------

    const answer = await generateAnswer(searchQuery, context);

    // --------------------------------------------------
    // 11. Safety check
    // --------------------------------------------------

    if (!answer || answer.trim() === '') {
      return res.json({
        answer:
          "I couldn't find this information in the available banking documents.",
        sources: [],
      });
    }

    // --------------------------------------------------
    // 12. Return sources
    // --------------------------------------------------

    const sources = finalResults.map((result) => ({
      document: result.payload.document,
      documentId: result.payload.documentId,
      fileType: result.payload.fileType,
      chunkIndex: result.payload.chunkIndex,
      score: Number(result.score.toFixed(3)),
    }));

    // --------------------------------------------------
    // 13. Final response
    // --------------------------------------------------

    res.json({
      answer: answer.trim(),
      sources,
    });
  } catch (error) {
    console.error('\nChat error:', error);

    res.status(500).json({
      error: 'Failed to generate answer',

      details: error.message,
    });
  }
});

module.exports = router;
