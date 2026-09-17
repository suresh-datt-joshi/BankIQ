require("dotenv").config();

const { generateEmbedding } = require("./services/embeddingService");

async function test() {
  try {
    const text =
      "Customers requesting account closure must provide valid identification.";

    const embedding = await generateEmbedding(text);

    console.log("Embedding generated successfully!");
    console.log("Vector dimensions:", embedding.length);
    console.log("First 5 values:", embedding.slice(0, 5));

  } catch (error) {
    console.error("Embedding error:", error);
  }
}

test();