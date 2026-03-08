export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const event = req.body;
    console.log('Retell webhook:', JSON.stringify(event).substring(0, 500));

    if (event.event !== 'call_analyzed') {
      return res.status(200).json({ received: true });
    }

    const call = event.data;
    const callId = call?.call_id;
    const analysis = call?.call_analysis;
    const custom = analysis?.custom_analysis_data;

    console.log('callId:', callId);
    console.log('custom data:', JSON.stringify(custom));

    if (!callId) {
      return res.status(200).json({ received: true, note: 'No call_id' });
    }

    const SUPA_URL = 'https://dhyzfnxygadkkniubrge.supabase.co';
    const SUPA_KEY = process.env.SUPABASE_SERVICE_KEY;

    const updates = {
      puntaje_total:      custom?.puntaje_total      ?? null,
      spin_situacion:     custom?.spin_situacion      ?? null,
      spin_problema:      custom?.spin_problema       ?? null,
      spin_implicacion:   custom?.spin_implicacion    ?? null,
      spin_necesidad:     custom?.spin_necesidad      ?? null,
      manejo_objeciones:  custom?.manejo_objeciones   ?? null,
      cierre:             custom?.cierre              ?? null,
      fortalezas:         custom?.fortalezas          ?? null,
      areas_mejora:       custom?.areas_mejora        ?? null,
      recomendaciones:    custom?.recomendaciones     ?? null,
      call_summary:       custom?.call_summary        ?? analysis?.call_summary ?? null,
      call_successful:    custom?.call_successful     ?? analysis?.call_successful ?? null,
      user_sentiment:     custom?.user_sentiment      ?? analysis?.user_sentiment ?? null,
    };

    console.log('Updates to apply:', JSON.stringify(updates));

    // Update via direct fetch (no SDK dependency)
    const url = `${SUPA_URL}/rest/v1/training_sessions?retell_call_id=eq.${callId}`;
    const r = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });

    const responseText = await r.text();
    console.log('Supabase response:', r.status, responseText.substring(0, 200));

    if (!r.ok) {
      return res.status(500).json({ error: `Supabase error: ${r.status}`, detail: responseText });
    }

    return res.status(200).json({ success: true, updated: responseText });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
