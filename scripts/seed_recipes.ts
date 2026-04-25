import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Note: Ensure you run this with Bun (e.g. `bun scripts/seed_recipes.ts`)
// so that .env is automatically loaded, or use dotenv if running with node.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env file!");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY to perform bulk inserts.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function run() {
  const dataDir = path.join(process.cwd(), 'scripts', 'data');
  const zipPath = path.join(dataDir, 'recipes_raw.zip');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Download the dataset if not already downloaded
  if (!fs.existsSync(zipPath)) {
    console.log("Downloading recipes_raw.zip from Eight Portions...");
    const response = await fetch("https://eightportions.com/recipes_raw.zip");
    if (!response.ok) {
      throw new Error(`Failed to download dataset: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));
    console.log("Download complete.");
  }

  // 2. Extract the dataset
  const filesToCheck = ['recipes_raw_nosource_fn.json', 'recipes_raw_nosource_epi.json', 'recipes_raw_nosource_ar.json'];
  const needsExtraction = filesToCheck.some(file => !fs.existsSync(path.join(dataDir, file)));

  if (needsExtraction) {
    console.log("Extracting recipes_raw.zip...");
    // Using Bun's shell or node's child_process
    execSync(`unzip -o ${zipPath} -d ${dataDir}`);
    console.log("Extraction complete.");
  }

  // 3. Parse and upload
  const BATCH_SIZE = 1000;
  let totalInserted = 0;

  for (const filename of filesToCheck) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File ${filename} not found, skipping...`);
      continue;
    }

    console.log(`Processing ${filename}...`);
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const recipesJson = JSON.parse(rawData);

    let batch: any[] = [];
    let count = 0;

    for (const [key, value] of Object.entries<any>(recipesJson)) {
      // Some keys might be corrupted or lack proper data
      if (!value || !value.title || !value.ingredients || !value.instructions) continue;

      const title = value.title.trim();
      const picture_link = value.picture_link || null;
      
      // Eight portions dataset sometimes has instructions as a single string, sometimes as an array
      const instructions = Array.isArray(value.instructions) 
        ? value.instructions.join('\n') 
        : String(value.instructions);

      // Ingredients might be an array or string
      const ingredients = Array.isArray(value.ingredients)
        ? value.ingredients
        : value.ingredients.split('\n').filter(Boolean);

      batch.push({
        id: key,
        title,
        ingredients,
        instructions,
        picture_link,
      });

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(batch);
        count += batch.length;
        totalInserted += batch.length;
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(batch);
      count += batch.length;
      totalInserted += batch.length;
    }

    console.log(`Finished ${filename}. Inserted ${count} valid recipes.`);
  }

  console.log(`All done! Successfully inserted ${totalInserted} recipes into the database.`);
}

async function insertBatch(batch: any[]) {
  const { error } = await supabase.from('recipes').upsert(batch, { onConflict: 'id' });
  if (error) {
    console.error("Error inserting batch:", error.message);
  } else {
    process.stdout.write(`+${batch.length} `);
  }
}

run().catch(console.error);
