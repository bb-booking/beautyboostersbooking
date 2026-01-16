import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { email, password, roles, booster_profile_id, setup_key } = await req.json()

    // Simple protection - require a setup key
    if (setup_key !== 'beautyboosters-setup-2025') {
      return new Response(
        JSON.stringify({ error: 'Invalid setup key' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[Setup] Creating user: ${email} with roles: ${roles?.join(', ')}`)

    // Create user with admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      console.error('[Setup] Create user error:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = userData.user.id
    console.log(`[Setup] User created with ID: ${userId}`)

    // Add roles if provided
    if (roles && Array.isArray(roles) && roles.length > 0) {
      const roleInserts = roles.map((role: string) => ({
        user_id: userId,
        role: role
      }))

      const { error: rolesError } = await supabaseAdmin
        .from('user_roles')
        .insert(roleInserts)

      if (rolesError) {
        console.error('[Setup] Roles insert error:', rolesError)
      } else {
        console.log(`[Setup] Roles added: ${roles.join(', ')}`)
      }
    }

    // Link to booster profile if provided
    if (booster_profile_id) {
      const { error: linkError } = await supabaseAdmin
        .from('booster_profiles')
        .update({ user_id: userId })
        .eq('id', booster_profile_id)

      if (linkError) {
        console.error('[Setup] Link booster profile error:', linkError)
      } else {
        console.log(`[Setup] Linked to booster profile: ${booster_profile_id}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        email: userData.user.email,
        roles: roles || [],
        message: 'User created successfully! You can now log in.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[Setup] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
