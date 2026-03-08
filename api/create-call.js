export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: process.env.RETELL_AGENT_ID
      })
    });

    const text = await response.text();
    console.log('Retell raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      console.error('Retell returned non-JSON:', text.substring(0, 200));
      return res.status(500).json({ error: 'Retell returned invalid response', raw: text.substring(0, 200) });
    }

    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Retell proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
