import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobApplicationRequest {
  job_id: string;
  booster_id: string;
  message?: string;
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

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { job_id, booster_id, message }: JobApplicationRequest = await req.json();

    console.log('🎯 Processing job application:', { job_id, booster_id });

    // Verify the booster_id matches the authenticated user
    if (booster_id !== user.id) {
      throw new Error('Cannot apply for jobs on behalf of another booster');
    }

    // Check if already applied
    const { data: existingApp } = await supabase
      .from('job_applications')
      .select('id, status')
      .eq('job_id', job_id)
      .eq('booster_id', booster_id)
      .maybeSingle();

    if (existingApp) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Du har allerede ansøgt om dette job',
          status: existingApp.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('required_skills, assigned_booster_id, boosters_needed, status, title')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'open') {
      return new Response(
        JSON.stringify({ success: false, message: 'Dette job er ikke længere tilgængeligt' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get booster profile with skills
    const { data: booster, error: boosterError } = await supabase
      .from('booster_profiles')
      .select('specialties, name')
      .eq('id', booster_id)
      .single();

    if (boosterError || !booster) {
      throw new Error('Booster profile not found');
    }

    console.log('🔍 Checking skills match:', {
      required: job.required_skills,
      booster: booster.specialties
    });

    // Check if booster's specialties match job's required skills
    const hasMatchingSkills = job.required_skills.length === 0 || 
      job.required_skills.some((skill: string) => booster.specialties.includes(skill));

    // Count current assigned boosters
    const { data: assignments } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', job_id)
      .eq('status', 'accepted');

    const currentAssignments = assignments?.length || 0;
    const hasSpace = currentAssignments < (job.boosters_needed || 1);

    console.log('📊 Assignment status:', {
      hasMatchingSkills,
      hasSpace,
      currentAssignments,
      boosters_needed: job.boosters_needed
    });

    let applicationStatus = 'pending';
    let autoAssigned = false;

    // Auto-assign if skills match and there's space
    if (hasMatchingSkills && hasSpace) {
      applicationStatus = 'accepted';
      autoAssigned = true;
      console.log('✅ Auto-assigning booster to job');
    } else {
      console.log('⏳ Application pending admin approval');
    }

    // Create application
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .insert({
        job_id,
        booster_id,
        message: message || 'Jeg er interesseret i dette job',
        status: applicationStatus
      })
      .select()
      .single();

    if (appError) {
      console.error('Error creating application:', appError);
      throw appError;
    }

    // If auto-assigned, update job if this is the first booster
    if (autoAssigned && !job.assigned_booster_id) {
      await supabase
        .from('jobs')
        .update({ 
          assigned_booster_id: booster_id,
          status: currentAssignments + 1 >= (job.boosters_needed || 1) ? 'assigned' : 'open'
        })
        .eq('id', job_id);

      console.log('📝 Updated job with assigned booster');
    }

    // Create notification for booster if auto-assigned
    if (autoAssigned) {
      await supabase.from('notifications').insert({
        recipient_id: booster_id,
        title: 'Job tildelt!',
        message: `Du er blevet automatisk tildelt jobbet: ${job.title}`,
        type: 'job_assignment',
        job_id: job_id
      });
    }

    const responseMessage = autoAssigned 
      ? 'Du er blevet automatisk tildelt jobbet!' 
      : 'Din ansøgning er sendt til admin til godkendelse';

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: responseMessage,
        auto_assigned: autoAssigned,
        application
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing job application:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});