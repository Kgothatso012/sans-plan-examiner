const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfPath = process.argv[2] || './sans-wiki/raw/557-sosh-l/557 Sosh L.pdf';

async function extractPDFText(pdfPath) {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);

    console.log('=== EXTRACTED TEXT FROM PDF ===\n');
    console.log(data.text);
    console.log('\n=== END OF EXTRACTED TEXT ===');

    // Also save to file
    const outputPath = pdfPath.replace('.pdf', '-extracted.txt');
    fs.writeFileSync(outputPath, data.text);
    console.log(`\nSaved to: ${outputPath}`);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

extractPDFText(pdfPath);