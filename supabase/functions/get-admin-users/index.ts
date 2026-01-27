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

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if caller has admin role
    const { data: roleCheck, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (roleError || !roleCheck) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all admin user IDs
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')

    if (rolesError) throw rolesError

    const adminUserIds = adminRoles?.map(r => r.user_id) || []

    // Fetch user emails from auth.users using admin API
    const adminUsers: { id: string; email: string; name: string }[] = []
    
    for (const userId of adminUserIds) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!userError && userData.user) {
        const email = userData.user.email || ''
        adminUsers.push({
          id: userId,
          email,
          name: getNameFromEmail(email)
        })
      }
    }

    return new Response(
      JSON.stringify({ admins: adminUsers }),
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

function getNameFromEmail(email: string): string {
  const emailNameMap: Record<string, string> = {
    'hello@beautyboosters.dk': 'Sarah',
    'maria@beautyboosters.dk': 'Maria',
    'stephanie@beautyboosters.dk': 'Stephanie',
    'laerke@beautyboosters.dk': 'Lærke',
    'louisebencard@hotmail.com': 'Louise',
    'louise@beautyboosters.dk': 'Louise',
  }
  
  if (emailNameMap[email.toLowerCase()]) {
    return emailNameMap[email.toLowerCase()]
  }
  
  // Fallback: capitalize first part of email
  const namePart = email.split('@')[0]
  return namePart.charAt(0).toUpperCase() + namePart.slice(1).replace(/[._-]/g, ' ')
}
