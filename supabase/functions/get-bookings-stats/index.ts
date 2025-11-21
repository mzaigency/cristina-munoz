import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRow {
  NOMBRE: string;
  TELEFONO: string;
  HORA: string;
  SERVICIO: string;
  CANAL: string;
  'ID_Parte 1': string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const googleRefreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!spreadsheetId || !googleRefreshToken || !googleClientId || !googleClientSecret) {
      return new Response(JSON.stringify({ error: 'Google Sheets credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Read from Google Sheets
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A2:N1000`;
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const sheetsData = await sheetsResponse.json();
    const rows: BookingRow[] = (sheetsData.values || []).map((row: string[]) => ({
      NOMBRE: row[0] || '',
      RECORDATORIO: row[1] || '',
      TELEFONO: row[2] || '',
      HORA: row[3] || '',
      VALORACION: row[4] || '',
      PETICION: row[5] || '',
      SERVICIO: row[6] || '',
      CANAL: row[7] || '',
      'ID_Parte 1': row[8] || '',
    }));

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Filter bookings with valid ID_Parte 1 (actual bookings)
    const validBookings = rows.filter(row => row['ID_Parte 1'] && row['ID_Parte 1'].trim() !== '');

    // Parse dates from HORA field (assuming format like "2025-01-15 10:00")
    const parseDate = (hora: string): Date | null => {
      try {
        const match = hora.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
        }
        return null;
      } catch {
        return null;
      }
    };

    const dailyBookings = validBookings.filter(row => {
      const date = parseDate(row.HORA);
      return date && date >= today;
    });

    const weeklyBookings = validBookings.filter(row => {
      const date = parseDate(row.HORA);
      return date && date >= weekAgo;
    });

    const monthlyBookings = validBookings.filter(row => {
      const date = parseDate(row.HORA);
      return date && date >= monthAgo;
    });

    // Count by channel
    const countByChannel = (bookings: BookingRow[]) => {
      const whatsapp = bookings.filter(b => b.CANAL?.toLowerCase().includes('whatsapp')).length;
      const crm = bookings.filter(b => b.CANAL?.toLowerCase().includes('crm')).length;
      const web = bookings.filter(b => b.CANAL?.toLowerCase().includes('web')).length;
      return { whatsapp, crm, web };
    };

    return new Response(
      JSON.stringify({
        daily: {
          total: dailyBookings.length,
          byChannel: countByChannel(dailyBookings),
        },
        weekly: {
          total: weeklyBookings.length,
          byChannel: countByChannel(weeklyBookings),
        },
        monthly: {
          total: monthlyBookings.length,
          byChannel: countByChannel(monthlyBookings),
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching bookings stats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
