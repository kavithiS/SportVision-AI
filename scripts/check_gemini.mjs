import fs from 'fs';

function loadEnv(path='..\\.env.local'){
  try {
    const text = fs.readFileSync(path,'utf8');
    const lines = text.split(/\r?\n/);
    const env = {};
    for(const l of lines){
      const m = l.match(/^\s*([A-Z0-9_]+)=(.*)$/i);
      if(m){
        env[m[1]] = m[2].replace(/(^\"|\"$)/g,'');
      }
    }
    return env;
  }catch(e){
    return {};
  }
}

(async ()=>{
  const env = loadEnv('./.env.local') // workspace root
  const key = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if(!key){
    console.error('No GEMINI_API_KEY found in .env.local or environment.');
    process.exit(2);
  }

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const client = new GoogleGenerativeAI(key);
    if(typeof client.listModels === 'function'){
      const list = await client.listModels();
      console.log('OK: listModels returned', Array.isArray(list) ? list.length : typeof list);
    } else {
      console.log('SDK does not provide listModels — this may be a version mismatch.');
    }
  } catch(err){
    console.error('ERROR:', err.message || err);
    if(err.response) console.error('RESPONSE:', err.response.status || err.response.statusText);
    process.exit(1);
  }
})();
