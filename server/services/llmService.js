const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// --------------------------------------------------
// Generate a standalone search query
// --------------------------------------------------

async function generateSearchQuery(question, history = []) {
  // If there is no conversation history, the original
  // question is already sufficient.
  if (!history || history.length === 0) {
    return question.trim();
  }

  // Only send the conversational text.
  // We do NOT send sources as factual context.
  const conversation = history
    .slice(-6)
    .map((message) => {
      const role = message.role === 'user' ? 'User' : 'Assistant';

      return `${role}: ${message.content}`;
    })
    .join('\n');

  const prompt = `
You are a search-query rewriting assistant for BankIQ.

Your job is to rewrite the user's latest question into
a single standalone search query for retrieving information
from banking documents.

Rules:
- Use the conversation only to resolve references such as:
  "it", "this", "that", "the rate", "the tenure", etc.
- Preserve the user's actual intent.
- Include the relevant subject from previous messages when necessary.
- Do NOT answer the question.
- Do NOT add facts that are not present in the conversation.
- Do NOT invent banking information.
- Return ONLY the rewritten search query.
- Keep it concise.

CONVERSATION:
${conversation}

LATEST USER QUESTION:
${question}

STANDALONE SEARCH QUERY:
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',

    contents: prompt,

    config: {
      maxOutputTokens: 50,

      thinkingConfig: {
        thinkingLevel: 'low',
      },
    },
  });

  const searchQuery = response.text?.trim();

  return searchQuery || question.trim();
}

// --------------------------------------------------
// Generate grounded banking answer
// --------------------------------------------------

async function generateAnswer(question, context) {
  const prompt = `
You are BankIQ, a banking document assistant.

Answer the user's question ONLY using the provided context.

Rules:
- Do not use outside knowledge.
- Do not guess or invent information.
- If information is missing, say:
"I couldn't find this information in the available banking documents."
- For multi-part questions, answer each part separately.
- If only some parts are supported, answer those and state which information is unavailable.
- Answer only what the user asked.
- Keep responses concise, clear, professional, and to the point. Use plain text only—no Markdown formatting.

Question:
${question}

Context:
${context}

ANSWER:
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',

    contents: prompt,

    config: {
      maxOutputTokens: 200,

      thinkingConfig: {
        thinkingLevel: 'low',
      },
    },
  });

  if (response.usageMetadata) {
    console.log('\nToken usage:');

    console.log('Prompt tokens:', response.usageMetadata.promptTokenCount);

    console.log('Output tokens:', response.usageMetadata.candidatesTokenCount);

    console.log(
      'Thinking tokens:',
      response.usageMetadata.thoughtsTokenCount || 0,
    );

    console.log('Total tokens:', response.usageMetadata.totalTokenCount);
  }

  return response.text.trim();
}

module.exports = {
  generateSearchQuery,
  generateAnswer,
};
