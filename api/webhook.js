import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://dhyzfnxygadkkniubrge.supabase.co',
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const event = req.body;
    console.log('Retell webhook event:', JSON.stringify(event).substring(0, 500));

    // Only process call_analyzed events (post-call data)
    if (event.event !== 'call_analyzed') {
      return res.status(200).json({ received: true });
    }

    const call = event.data;
    const callId = call?.call_id;
    const postCallData = call?.call_analysis;

    if (!callId || !postCallData) {
      return res.status(200).json({ received: true, note: 'No call_id or analysis' });
    }

    // Extract SPIN scores from post-call data
    const updates = {
      puntaje_total:       postCallData.custom_analysis_data?.puntaje_total       ?? null,
      spin_situacion:      postCallData.custom_analysis_data?.spin_situacion       ?? null,
      spin_problema:       postCallData.custom_analysis_data?.spin_problema        ?? null,
      spin_implicacion:    postCallData.custom_analysis_data?.spin_implicacion     ?? null,
      spin_necesidad:      postCallData.custom_analysis_data?.spin_necesidad       ?? null,
      manejo_objeciones:   postCallData.custom_analysis_data?.manejo_objeciones    ?? null,
      cierre:              postCallData.custom_analysis_data?.cierre               ?? null,
      fortalezas:          postCallData.custom_analysis_data?.fortalezas           ?? null,
      areas_mejora:        postCallData.custom_analysis_data?.areas_mejora         ?? null,
      recomendaciones:     postCallData.custom_analysis_data?.recomendaciones      ?? null,
      call_summary:        postCallData.custom_analysis_data?.call_summary         ?? postCallData.call_summary ?? null,
      call_successful:     postCallData.custom_analysis_data?.call_successful      ?? postCallData.call_successful ?? null,
      user_sentiment:      postCallData.custom_analysis_data?.user_sentiment       ?? postCallData.user_sentiment ?? null,
    };

    console.log('Updating session with call_id:', callId, 'updates:', JSON.stringify(updates));

    // Update training_sessions where retell_call_id matches
    const { data, error } = await sb
      .from('training_sessions')
      .update(updates)
      .eq('retell_call_id', callId);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Session updated successfully');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
