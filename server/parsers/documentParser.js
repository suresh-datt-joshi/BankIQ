const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const XLSX = require("xlsx");
const { parse } = require("csv-parse/sync");
const { PDFParse } = require("pdf-parse");

async function parsePDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);

  const parser = new PDFParse({
    data: dataBuffer,
  });

  try {
    const result = await parser.getText();

    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function parseDOCX(filePath) {
  const result = await mammoth.extractRawText({
    path: filePath,
  });

  return result.value;
}

function parseXLSX(filePath) {
  const workbook = XLSX.readFile(filePath);

  let text = "";

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    text += `\nSheet: ${sheetName}\n`;

    for (const row of rows) {
      const rowText = row
        .map((cell) => String(cell).trim())
        .filter(Boolean)
        .join(" | ");

      if (rowText) {
        text += rowText + "\n";
      }
    }
  }

  return text;
}

function parseCSV(filePath) {
  const csvText = fs.readFileSync(filePath, "utf-8");

  const records = parse(csvText, {
    skip_empty_lines: true,
  });

  return records
    .map((row) =>
      row
        .map((cell) => String(cell).trim())
        .join(" | ")
    )
    .join("\n");
}

async function parseDocument(filePath, originalName) {
  const extension = path
    .extname(originalName)
    .toLowerCase();

  switch (extension) {
    case ".pdf":
      return await parsePDF(filePath);

    case ".docx":
      return await parseDOCX(filePath);

    case ".xlsx":
      return parseXLSX(filePath);

    case ".csv":
      return parseCSV(filePath);

    default:
      throw new Error(
        `Unsupported file type: ${extension}`
      );
  }
}

module.exports = {
  parseDocument,
};