import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const { error } = await supabase
    .from('waitlist')
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: 'email' });

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }

  return res.status(200).json({ success: true });
}
