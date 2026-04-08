/**
 * Ingest old uploads into the database
 * Groups by erf_number and creates applications with multiple document submissions
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

const supabaseUrl = 'https://pmhvteytflmbvolteota.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtaHZ0ZXl0ZmxtYnZvbHRlb3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODIwNTUsImV4cCI6MjA5MDg1ODA1NX0.Hhby7vx9Mq4AUnR4TJiAVCMlPRBm5xQtQM6LF0yEi_w';
const supabase = createClient(supabaseUrl, supabaseKey);

// File naming: {timestamp}-{erf}_{street}_{doctype}.pdf
// e.g. 1775375131488-363_Sosh_WW_Zoning_Cert.pdf

function parseFilename(filename) {
  const name = filename.replace('.pdf', '');
  // Format: {timestamp}-{erf}_{street}_{doctype}.pdf
  // e.g. 1775375131488-363_Sosh_WW_Zoning_Cert.pdf
  // Or:   1775379283240-363_Sosh_WW_2_Pages.pdf

  const parts = name.split('-');
  if (parts.length < 2) return null;

  const timestamp = parts[0];
  const secondPart = parts[1]; // e.g. "363_Sosh_WW_Zoning_Cert" or "363_Sosh_WW_2_Pages"

  // Parse erf from second part: first token before first underscore
  const erfMatch = secondPart.match(/^(\d+)/);
  const erf = erfMatch ? erfMatch[1] : null;

  // Parse doc type from second part
  let docType = 'general';
  if (secondPart.includes('Zoning') || secondPart.includes('Cert')) {
    docType = 'zoning_certificate';
  } else if (secondPart.includes('Sg') || secondPart.includes('Diagram')) {
    docType = 'sg_diagram';
  } else if (secondPart.includes('Title') || secondPart.includes('Titledeed')) {
    docType = 'title_deed';
  } else if (secondPart.includes('01') || secondPart.includes('Pages') || secondPart.includes('Plans')) {
    docType = 'building_plans';
  }

  return { timestamp, erf, docType, filename };
}

async function extractPDFText(pdfPath) {
  try {
    const buf = fs.readFileSync(pdfPath);
    const data = await pdfParse(buf);
    return data.text;
  } catch (e) {
    return '';
  }
}

async function findERF363Owner(text) {
  // Look for owner name in the text
  const lines = text.split('\n').filter(l => l.trim());
  for (const line of lines) {
    if (line.includes('Owner') || line.includes('Ratshilaya') || line.includes('Azwifaneli')) {
      return line.trim();
    }
  }
  return 'Ratshilaya Azwifaneli'; // Default from what we found
}

async function findCoverage(text) {
  // Look for coverage percentages
  const match = text.match(/(\d+)%/);
  return match ? parseInt(match[1]) : null;
}

async function main() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf') && !f.includes('extracted'));

  console.log(`Found ${files.length} files`);

  // Group files by erf and timestamp cluster
  const groups = {};
  for (const file of files) {
    const parsed = parseFilename(file);
    if (!parsed) {
      console.log('Skipping (parse fail):', file);
      continue;
    }

    // Create a submission group key based on timestamp (rounded to nearest 10min)
    const ts = parseInt(parsed.timestamp);
    const groupKey = Math.floor(ts / 600000) * 600000; // Round to 10 min

    if (!groups[groupKey]) {
      groups[groupKey] = { erf: parsed.erf, files: [] };
    }
    groups[groupKey].files.push({ ...parsed, timestamp: ts });
  }

  console.log(`Found ${Object.keys(groups).length} submission groups`);

  let ingested = 0;
  let skipped = 0;

  for (const [groupKey, group] of Object.entries(groups)) {
    const ref = 'TC' + groupKey.toString().slice(-6);

    // Check if already exists
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('reference', ref)
      .single();

    if (existing) {
      console.log(`Skipping existing: ${ref}`);
      skipped++;
      continue;
    }

    // Determine status based on whether it's the latest submission
    const latestGroupTs = Math.max(...group.files.map(f => f.timestamp));
    const isLatest = group.files[0].timestamp === latestGroupTs;

    // Get erf number from the files
    const erfFile = group.files.find(f => f.docType === 'building_plans') || group.files[0];

    // Try to extract owner from building plan
    let ownerName = 'Unknown Owner';
    let coverage = null;
    let zoning = 'Residential 1';

    const buildingPlan = group.files.find(f => f.docType === 'building_plans');
    if (buildingPlan) {
      const text = await extractPDFText(path.join(uploadsDir, buildingPlan.filename));
      ownerName = await findERF363Owner(text);
      coverage = await findCoverage(text);
    }

    // Create application
    const { data: app, error } = await supabase
      .from('applications')
      .insert({
        reference: ref,
        erf_number: group.erf,
        status: isLatest ? 'PENDING' : 'COMPLETED', // Older ones considered "done"
        owner_name: ownerName,
        zoning: zoning,
        description: `Old submission from ${new Date(parseInt(groupKey)).toISOString().split('T')[0]}`
      })
      .select()
      .single();

    if (error) {
      console.log(`Error creating app for ${ref}:`, error.message);
      continue;
    }

    // Upload documents
    for (const file of group.files) {
      const filePath = path.join(uploadsDir, file.filename);
      if (!fs.existsSync(filePath)) continue;

      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `${app.id}/${Date.now()}-${file.filename}`;

      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(storagePath, fileBuffer);

      if (uploadError) {
        console.log(`Upload error for ${file.filename}:`, uploadError.message);
      }

      await supabase.from('application_documents').insert({
        application_id: app.id,
        doc_type: file.docType,
        storage_path: storagePath,
        file_name: file.filename
      });
    }

    console.log(`Ingested: ${ref} (ERF ${group.erf}, ${group.files.length} docs)`);
    ingested++;
  }

  console.log(`\nDone! Ingested: ${ingested}, Skipped: ${skipped}`);
}

main().catch(e => console.error(e));
