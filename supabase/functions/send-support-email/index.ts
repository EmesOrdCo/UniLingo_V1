import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request body
    const { subject, description, userEmail, userName, appVersion, deviceInfo, reportId } = await req.json()

    // Create email content
    const emailContent = `Hello UniLingo Support Team,

A new issue has been reported through the app. Details are below:

Report ID: ${reportId}
User Name: ${userName}
User Email: ${userEmail}
App Version: ${appVersion}
Device/Platform: ${deviceInfo}

Issue Description:
${description}

Steps to Reproduce (if provided):
Not provided

Screenshot/Attachment:
Not provided

Thank you,
UniLingo Automated Issue Reporter`

    // Send email using Resend (you can replace with your preferred email service)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'UniLingo Support <support@unilingo.com>',
        to: 'unilingo.help@gmail.com',
        subject: `UniLingo Support Request - ${reportId}`,
        text: emailContent,
      }),
    })

    if (!emailResponse.ok) {
      throw new Error(`Email service error: ${emailResponse.statusText}`)
    }

    // Log the support request to database (optional)
    const { error: dbError } = await supabase
      .from('support_requests')
      .insert({
        report_id: reportId,
        user_email: userEmail,
        user_name: userName,
        subject: subject,
        description: description,
        app_version: appVersion,
        device_info: deviceInfo,
        status: 'open',
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request if database logging fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Support request sent successfully',
        reportId: reportId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
