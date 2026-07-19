import { resolve } from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function run() {
  const res = await fetch('http://localhost:3000/drops');
  const html = await res.text();
  
  // Find first occurrence of ProductCard name / image
  const cardIndex = html.indexOf('ProductCard');
  console.log('HTML SLICE:', html.slice(cardIndex - 500, cardIndex + 2000));
}

run().catch(console.error);
