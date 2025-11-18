import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApprovalRequest {
  application_id: string;
  approved: boolean;
  rejection_reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can approve booster applications');
    }

    const { application_id, approved, rejection_reason }: ApprovalRequest = await req.json();

    console.log('🔍 Processing booster application approval:', { application_id, approved });

    // Get application
    const { data: application, error: appError } = await supabase
      .from('booster_applications')
      .select('*')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'pending') {
      throw new Error('Application has already been processed');
    }

    if (approved) {
      // Create booster profile
      const { error: profileError } = await supabase
        .from('booster_profiles')
        .insert({
          id: application.user_id,
          name: application.name,
          specialties: application.skills,
          location: application.city || 'København',
          hourly_rate: 500, // Default rate, can be updated later
          bio: null,
          years_experience: application.years_experience,
          is_available: true
        });

      if (profileError) {
        console.error('Error creating booster profile:', profileError);
        throw new Error('Failed to create booster profile');
      }

      // Add booster role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: application.user_id,
          role: 'booster'
        });

      if (roleError) {
        console.error('Error adding booster role:', roleError);
        // Don't throw, role might already exist
      }

      // Update application status
      await supabase
        .from('booster_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', application_id);

      // Send notification to the new booster
      await supabase.from('notifications').insert({
        recipient_id: application.user_id,
        title: 'Velkommen til Beauty Boosters!',
        message: 'Din ansøgning er blevet godkendt. Du er nu en del af vores team!',
        type: 'booster_approved'
      });

      console.log('✅ Booster application approved');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Booster er blevet godkendt og oprettet'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      // Reject application
      await supabase
        .from('booster_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: rejection_reason || 'Ikke specificeret'
        })
        .eq('id', application_id);

      // Send notification
      await supabase.from('notifications').insert({
        recipient_id: application.user_id,
        title: 'Ansøgning afvist',
        message: rejection_reason || 'Din ansøgning er blevet afvist',
        type: 'booster_rejected'
      });

      console.log('❌ Booster application rejected');

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Ansøgningen er blevet afvist'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error processing booster approval:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});