import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const API_TOKEN = Deno.env.get('API_TOKEN')!;
const API_BASE_URL = 'https://app.healthcoversonline.com/api';
const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/TeyeZ3MtpfxIZIDzupOT/webhook-trigger/f5b6dffa-e73a-4497-a12e-d0be418655f5';

async function fetchInvoices() {
  const response = await fetch(`${API_BASE_URL}/invoice/?status=unpaid`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch invoices: ${response.statusText}`);
  }

  const data = await response.json();
  return data.payload || [];
}

async function sendWebhookNotification(invoice: any) {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error(`Failed to send webhook for invoice ${invoice.id}:`, error);
    throw error;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const invoices = await fetchInvoices();
    const results = [];
    
    // Update customer invoice statuses and send webhooks
    for (const invoice of invoices) {
      try {
        // Update customer status
        const { error } = await supabase
          .from('customers')
          .update({ invoice_status: 'unpaid' })
          .eq('customerid', invoice.customerId.toString());

        if (error) {
          console.error(`Failed to update customer ${invoice.customerId}:`, error);
          results.push({
            invoiceId: invoice.id,
            status: 'error',
            error: error.message
          });
          continue;
        }

        // Send webhook notification
        await sendWebhookNotification(invoice);
        
        results.push({
          invoiceId: invoice.id,
          status: 'success'
        });
      } catch (error) {
        results.push({
          invoiceId: invoice.id,
          status: 'error',
          error: error.message
        });
      }
    }

    // Set all other customers to 'paid' status
    const { error: updateError } = await supabase
      .from('customers')
      .update({ invoice_status: 'paid' })
      .not('customerid', 'in', invoices.map(i => i.customerId.toString()));

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Invoice statuses updated successfully',
        results 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error('Error updating invoice statuses:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});