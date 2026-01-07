import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsError } = await supabaseAdmin.auth.getClaims(token)
    
    if (claimsError || !claims?.claims) {
      console.error('Claims error:', claimsError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const callerId = claims.claims.sub as string

    // Check if caller has admin role
    const { data: roleCheck, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleCheck) {
      console.error('Role check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, password, roles, booster_profile_id } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating user: ${email} with roles: ${roles?.join(', ')}`)

    // Create user with admin API
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (createError) {
      console.error('Create user error:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = userData.user.id
    console.log(`User created with ID: ${userId}`)

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
        console.error('Roles insert error:', rolesError)
        // Don't fail, user is created
      } else {
        console.log(`Roles added: ${roles.join(', ')}`)
      }
    }

    // Link to booster profile if provided
    if (booster_profile_id) {
      const { error: linkError } = await supabaseAdmin
        .from('booster_profiles')
        .update({ user_id: userId })
        .eq('id', booster_profile_id)

      if (linkError) {
        console.error('Link booster profile error:', linkError)
      } else {
        console.log(`Linked to booster profile: ${booster_profile_id}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        email: userData.user.email,
        roles: roles || []
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
