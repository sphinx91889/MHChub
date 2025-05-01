import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { subDays } from 'npm:date-fns@3.3.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// API configuration
const API_TOKEN = Deno.env.get('API_TOKEN')!;
const API_BASE_URL = 'https://app.healthcoversonline.com/api';

async function fetchClients() {
  const response = await fetch(`${API_BASE_URL}/customer`, {
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.statusText}`);
  }

  const data = await response.json();
  return data.payload || [];
}

async function createContractTask(clientName: string, clientId: number) {
  const { data: adminUser } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single();

  if (!adminUser) {
    throw new Error('No admin user found to assign task');
  }

  const { error } = await supabase
    .from('tasks')
    .insert({
      title: `Contract Signing Required - ${clientName}`,
      description: `Client ${clientName} (ID: ${clientId}) was created within the last 30 days and has an inactive status. Please follow up to get the contract signed.`,
      status: 'pending',
      priority: 'high',
      category: 'client',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      assigned_to_user_id: adminUser.id,
      created_by: adminUser.id
    });

  if (error) {
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Get all clients
    const clients = await fetchClients();
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Filter clients created in last 30 days with inactive status
    const inactiveRecentClients = clients.filter((client: any) => {
      const createdAt = new Date(client.createdat);
      return (
        !client.isActive &&
        createdAt >= thirtyDaysAgo
      );
    });

    // Create tasks for filtered clients
    const results = await Promise.allSettled(
      inactiveRecentClients.map((client: any) =>
        createContractTask(client.companyName, client.id)
      )
    );

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({
        message: `Created ${successes} tasks, ${failures} failures`,
        totalProcessed: inactiveRecentClients.length
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );

  } catch (error) {
    console.error('Error processing contract tasks:', error);
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