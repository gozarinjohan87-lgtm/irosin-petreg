import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-runtime, x-supabase-client-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);
  console.info('Admin user creation request received.');

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Authentication is required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('Supabase function secrets are not configured.');
    return respond({ error: 'Account creation is not configured on the server.' }, 500);
  }

  const token = authorization.slice('Bearer '.length);
  const callerClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: callerData, error: callerError } = await callerClient.auth.getUser(token);
  if (callerError || !callerData.user) {
    console.warn('Rejected admin user creation: caller session is invalid.');
    return respond({ error: 'Your session is invalid or expired. Sign in again and retry.' }, 401);
  }

  const { data: callerProfile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role, status')
    .eq('auth_user_id', callerData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Could not verify admin profile:', profileError);
    return respond({ error: 'Could not verify your PetReg permissions.' }, 500);
  }
  if (callerProfile?.role !== 'admin' || callerProfile.status !== 'active') {
    console.warn('Rejected admin user creation: caller profile is not an active administrator.');
    return respond({ error: 'Only an active administrator can create accounts.' }, 403);
  }

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return respond({ error: 'Invalid request body.' }, 400);
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const role = input.role;
  const barangay = typeof input.barangay === 'string' ? input.barangay.trim() : '';
  const operatorPosition = typeof input.operatorPosition === 'string' ? input.operatorPosition.trim() : '';
  if (!name || !email.includes('@') || password.length < 8) {
    return respond({ error: 'Provide a name, valid email, and password of at least 8 characters.' }, 400);
  }
  if (role !== 'admin' && role !== 'operator' && role !== 'owner') {
    return respond({ error: 'The selected account role is not supported.' }, 400);
  }
  if (role === 'operator' && (!barangay || !operatorPosition)) {
    return respond({ error: 'Operators need an assigned barangay and position.' }, 400);
  }

  const prefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'user';
  const username = `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, username },
  });
  if (createError || !created.user) {
    console.error('Supabase Auth rejected account creation:', createError?.message ?? 'No user returned.');
    return respond({ error: createError?.message ?? 'Supabase did not create the account.' }, 400);
  }

  try {
    const { data: existingProfile, error: lookupError } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('auth_user_id', created.user.id)
      .maybeSingle();
    if (lookupError) throw lookupError;

    let profileId = existingProfile?.id;
    if (!profileId) {
      const profileToInsert: Record<string, unknown> = {
        auth_user_id: created.user.id,
        username,
        name,
        email,
        role,
        barangay: barangay || 'San Julian',
        status: 'active',
        verification_status: role === 'owner' ? 'verified' : 'pending',
      };
      if (role === 'operator') profileToInsert.operator_position = operatorPosition;

      const { data: insertedProfile, error: insertError } = await serviceClient
        .from('profiles')
        .insert(profileToInsert)
        .select('id')
        .single();
      if (insertError) throw insertError;
      profileId = insertedProfile.id;
    }

    const profileChanges: Record<string, unknown> = {
      role,
      barangay: barangay || 'San Julian',
      status: 'active',
      verification_status: role === 'owner' ? 'verified' : 'pending',
      updated_at: new Date().toISOString(),
    };
    if (role === 'operator') profileChanges.operator_position = operatorPosition;

    const { data: profile, error: updateError } = await serviceClient
      .from('profiles')
      .update(profileChanges)
      .eq('id', profileId)
      .select('*')
      .single();
    if (updateError) throw updateError;

    return respond({ profile });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown database error.';
    console.error('Failed to create PetReg profile for new auth user:', detail);
    const { error: profileCleanupError } = await serviceClient
      .from('profiles')
      .delete()
      .eq('auth_user_id', created.user.id);
    const { error: authCleanupError } = await serviceClient.auth.admin.deleteUser(created.user.id);
    if (profileCleanupError || authCleanupError) {
      console.error('Failed to roll back incomplete account creation:', {
        profileCleanupError,
        authCleanupError,
      });
    }
    return respond({
      error: `Could not save the PetReg profile. Confirm the required Supabase migrations are applied. ${detail}`,
    }, 500);
  }
});
