import fs from 'fs/promises';
import path from 'path';

async function main(){
  const UPLOAD_DIR = path.join(process.cwd(),'uploads');
  const files = await fs.readdir(UPLOAD_DIR);
  if(!files || files.length===0){
    console.error('No files in uploads/');
    process.exit(2);
  }
  const stats = [];
  for(const f of files){
    try{
      const s = await fs.stat(path.join(UPLOAD_DIR,f));
      stats.push({f,stat:s});
    }catch(e){}
  }
  const sorted = stats.sort((a,b)=>b.stat.mtimeMs - a.stat.mtimeMs);
  const latest = sorted[0].f;
  const full = path.join(UPLOAD_DIR, latest);
  console.log('Using file:', full);
  const buf = await fs.readFile(full);
  const b64 = buf.toString('base64');
  // Try env var, then .env.local
  let apiKey = process.env.GEMINI_API_KEY;
  if(!apiKey){
    try{
      const envText = await fs.readFile(path.join(process.cwd(), '.env.local'),'utf8');
      for(const line of envText.split(/\r?\n/)){
        const m = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.+)$/);
        if(m){ apiKey = m[1].replace(/^"|"$/g,'').trim(); break; }
      }
    }catch(e){}
  }
  if(!apiKey){
    console.error('No GEMINI_API_KEY in environment or .env.local');
    process.exit(2);
  }
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const promptText = `Analyze this image and identify:\n1. The sport being played or depicted\n2. A brief description (1-2 sentences)\n3. Your confidence level (high, medium, low)\nPlease respond in JSON format as {"sport":...,"description":...,"confidence":...,"details":...}`;

  const tryBodies = [
    { contents: [promptText] },
    { contents: [{ text: promptText }] },
    { input: promptText },
    { prompt: promptText },
    { inputs: [promptText] },
    { instances: [ { content: [ { image: { mime_type: 'image/jpeg', data: b64 } }, { text: promptText } ] } ] },
    { instances: [ { inputs: [ { image: { mime_type: 'image/jpeg', data: b64 } }, { text: promptText } ] } ] },
    { prompt: { parts: [ { type: 'image', image: { mime_type: 'image/jpeg', data: b64 } }, { type: 'text', text: promptText } ] } },
    { messages: [ { role: 'user', content: [ { type: 'image', image: { mime_type: 'image/jpeg', data: b64 } }, { type: 'text', text: promptText } ] } ] },
    { content: [ { image: { mime_type: 'image/jpeg', data: b64 } }, promptText ] },
    // Additional variants
    { model: model, text: promptText },
    { model: model, prompt: { messages: [{ role: 'user', content: promptText }] } },
    { prompt: { messages: [{ role: 'user', content: [{ type: 'text', text: promptText }] }] } },
    { input: [{ text: { text: promptText } }] },
    { input: [{ content: [{ text: promptText }] }] },
    { content: [{ text: promptText }] },
    { inputs: [{ text: promptText }] },
    { instances: [{ text: promptText }] },
    { prompt: { text: promptText } },
    // More experimental shapes
    { instances: [{ content: [{ type: 'text', text: promptText }] }] },
    { input: [{ content: [{ type: 'text', text: promptText }] }] },
    { inputs: [{ content: [{ type: 'text', text: promptText }] }] },
    { messages: [{ role: 'user', content: promptText }] },
    { content: [{ text: promptText }] },
    { data: { content: promptText } },
    { payload: { text: promptText } },
    { request: { prompt: promptText } },
  ];

  console.log('Posting to', url);
  try {
    for (const b of tryBodies) {
      try {
        console.log('\nTrying payload shape:', JSON.stringify(Object.keys(b)));
        const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(b) });
        const txt = await res.text();
        console.log('Status:', res.status, res.statusText);
        console.log('Response (truncated 4000 chars):\n', txt.slice(0,4000));
        if (res.status >= 200 && res.status < 300) {
          console.log('Success with payload:', JSON.stringify(b));
          break;
        }
      } catch (err) {
        console.error('Fetch error for payload:', err);
      }
    }
  } catch (outerErr) {
    console.error('Unexpected error during payload trials:', outerErr);
  }
}

main();
