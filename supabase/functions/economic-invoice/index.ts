import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EconomicInvoiceRequest {
  jobId: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  description: string;
  dueDate?: string;
}

interface EconomicCustomer {
  customerNumber: number;
  name: string;
  email?: string;
}

interface EconomicInvoice {
  date: string;
  currency: string;
  exchangeRate: number;
  netAmount: number;
  netAmountInBaseCurrency: number;
  grossAmount: number;
  grossAmountInBaseCurrency: number;
  vatAmount: number;
  roundingAmount: number;
  costPriceInBaseCurrency: number;
  dueDate: string;
  paymentTerms: {
    paymentTermsNumber: number;
  };
  customer: {
    customerNumber: number;
  };
  recipient: {
    name: string;
    address?: string;
    zip?: string;
    city?: string;
    country?: string;
    ean?: string;
    publicEntryNumber?: string;
  };
  layout: {
    layoutNumber: number;
  };
  lines: Array<{
    lineNumber: number;
    sortKey: number;
    unit: {
      unitNumber: number;
    };
    product?: {
      productNumber: string;
    };
    quantity: number;
    unitNetPrice: number;
    discountPercentage: number;
    unitCostPrice: number;
    totalNetAmount: number;
    marginInBaseCurrency: number;
    marginPercentage: number;
    description: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ECONOMIC_API_SECRET = Deno.env.get('ECONOMIC_API_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!ECONOMIC_API_SECRET) {
      throw new Error('ECONOMIC_API_SECRET is not set');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration is missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { jobId, customerName, customerEmail, amount, description, dueDate }: EconomicInvoiceRequest = await req.json();

    console.log('Creating invoice for job:', jobId);

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Job not found');
    }

    if (job.client_type !== 'virksomhed') {
      throw new Error('This job is not a business client');
    }

    // Economic API base URL
    const baseUrl = 'https://restapi.e-conomic.com';

    // Headers for e-conomic API
    const headers = {
      'X-AppSecretToken': ECONOMIC_API_SECRET,
      'X-AgreementGrantToken': ECONOMIC_API_SECRET,
      'Content-Type': 'application/json',
    };

    // Step 1: Find or create customer in e-conomic
    let customer: EconomicCustomer;

    try {
      // Try to find existing customer by name
      const customerSearchResponse = await fetch(
        `${baseUrl}/customers?filter=name$like:${encodeURIComponent(customerName)}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!customerSearchResponse.ok) {
        throw new Error(`Failed to search customers: ${customerSearchResponse.status}`);
      }

      const customerSearchData = await customerSearchResponse.json();
      
      if (customerSearchData.collection && customerSearchData.collection.length > 0) {
        customer = customerSearchData.collection[0];
        console.log('Found existing customer:', customer.customerNumber);
      } else {
        // Create new customer
        console.log('Creating new customer:', customerName);
        const newCustomerResponse = await fetch(`${baseUrl}/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: customerName,
            email: customerEmail || '',
            customerGroup: {
              customerGroupNumber: 1 // Default customer group
            },
            currency: 'DKK',
            paymentTerms: {
              paymentTermsNumber: 1 // Default payment terms
            },
            vatZone: {
              vatZoneNumber: 1 // Default VAT zone (Denmark)
            }
          }),
        });

        if (!newCustomerResponse.ok) {
          const errorText = await newCustomerResponse.text();
          throw new Error(`Failed to create customer: ${newCustomerResponse.status} - ${errorText}`);
        }

        customer = await newCustomerResponse.json();
        console.log('Created new customer:', customer.customerNumber);
      }
    } catch (error) {
      console.error('Error handling customer:', error);
      throw new Error('Failed to handle customer in e-conomic');
    }

    // Step 2: Create draft invoice in e-conomic
    const vatAmount = amount * 0.25; // 25% VAT
    const netAmount = amount - vatAmount;
    const invoiceDueDate = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 14 days from now

    const invoiceData: Partial<EconomicInvoice> = {
      date: new Date().toISOString().split('T')[0],
      currency: 'DKK',
      exchangeRate: 1,
      dueDate: invoiceDueDate,
      paymentTerms: {
        paymentTermsNumber: 1
      },
      customer: {
        customerNumber: customer.customerNumber
      },
      recipient: {
        name: customerName,
      },
      layout: {
        layoutNumber: 1 // Default layout
      },
      lines: [
        {
          lineNumber: 1,
          sortKey: 1,
          unit: {
            unitNumber: 1 // Default unit (e.g., "stk")
          },
          quantity: 1,
          unitNetPrice: netAmount,
          discountPercentage: 0,
          unitCostPrice: 0,
          totalNetAmount: netAmount,
          marginInBaseCurrency: 0,
          marginPercentage: 0,
          description: description || `Beauty service: ${job.service_type} - ${job.location}`
        }
      ]
    };

    console.log('Creating invoice in e-conomic...');
    const invoiceResponse = await fetch(`${baseUrl}/invoices/drafts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invoiceData),
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error('Failed to create invoice:', errorText);
      throw new Error(`Failed to create invoice: ${invoiceResponse.status} - ${errorText}`);
    }

    const economicInvoice = await invoiceResponse.json();
    console.log('Created invoice:', economicInvoice.draftInvoiceNumber);

    // Step 3: Book the draft invoice to make it official
    const bookResponse = await fetch(`${baseUrl}/invoices/drafts/${economicInvoice.draftInvoiceNumber}/book`, {
      method: 'POST',
      headers,
    });

    if (!bookResponse.ok) {
      const errorText = await bookResponse.text();
      console.error('Failed to book invoice:', errorText);
      throw new Error(`Failed to book invoice: ${bookResponse.status} - ${errorText}`);
    }

    const bookedInvoice = await bookResponse.json();
    console.log('Booked invoice:', bookedInvoice.bookedInvoiceNumber);

    // Step 4: Save invoice to Supabase
    const { data: savedInvoice, error: saveError } = await supabase
      .from('invoices')
      .insert([{
        job_id: jobId,
        economic_invoice_id: bookedInvoice.bookedInvoiceNumber,
        invoice_number: bookedInvoice.bookedInvoiceNumber.toString(),
        customer_name: customerName,
        customer_email: customerEmail,
        amount: netAmount,
        vat_amount: vatAmount,
        total_amount: amount,
        status: 'sent',
        sent_at: new Date().toISOString(),
        due_date: invoiceDueDate
      }])
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save invoice to database:', saveError);
      throw new Error('Failed to save invoice to database');
    }

    // Step 5: Update job with invoice info
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        invoice_sent: true,
        invoice_id: savedInvoice.id
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('Failed to update job:', updateError);
    }

    console.log('Invoice process completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: savedInvoice.id,
          economic_invoice_id: bookedInvoice.bookedInvoiceNumber,
          invoice_number: bookedInvoice.bookedInvoiceNumber.toString(),
          amount: amount,
          customer_name: customerName,
          status: 'sent'
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in economic-invoice function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});