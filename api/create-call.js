export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Read metadata sent from the HTML
    const body = req.body || {};
    const metadata = body.metadata || {};

    const response = await fetch('https://api.retellai.com/v2/create-web-call', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RETELL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: process.env.RETELL_AGENT_ID,
        metadata: metadata,
        // Pass client profile as dynamic variables so {{client_name}} etc work in prompt
        retell_llm_dynamic_variables: {
          client_name:     metadata.client_name     || '',
          client_business: metadata.client_business || '',
          client_country:  metadata.client_country  || '',
          client_status:   metadata.client_status   || '',
          difficulty:      metadata.difficulty      || 'medio',
          vendor_name:     metadata.vendor_name     || '',
          product:         metadata.product         || ''
        }
      })
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(500).json({ error: 'Retell returned invalid response', raw: text.substring(0,200) }); }

    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
