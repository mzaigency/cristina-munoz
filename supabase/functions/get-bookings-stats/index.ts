import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingRow {
  NOMBRE: string;
  RECORDATORIO: string;
  TELEFONO: string;
  HORA: string;
  VALORACION: string;
  PETICION: string;
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

    // Read from Google Sheets - Try without sheet name first to get all data
    const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:N1000`;
    console.log(`Fetching from: ${sheetsUrl}`);
    
    const sheetsResponse = await fetch(sheetsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      console.error('Sheets API error:', errorText);
      throw new Error(`Failed to fetch from Google Sheets: ${sheetsResponse.status} - ${errorText}`);
    }

    const sheetsData = await sheetsResponse.json();
    console.log(`Raw response keys:`, Object.keys(sheetsData));
    console.log(`Values array length:`, sheetsData.values?.length || 0);
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

    console.log(`Total rows from Sheets: ${rows.length}`);
    console.log('Sample row:', rows[0]);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    console.log(`Date ranges - Today: ${today.toISOString()}, Week ago: ${weekAgo.toISOString()}, Month ago: ${monthAgo.toISOString()}`);

    // Filter bookings with valid ID_Parte 1 (actual bookings)
    const validBookings = rows.filter(row => row['ID_Parte 1'] && row['ID_Parte 1'].trim() !== '');
    
    console.log(`Valid bookings: ${validBookings.length}`);
    if (validBookings.length > 0) {
      console.log('Sample booking:', JSON.stringify(validBookings[0]));
    }

    // Parse dates from PETICION field (ISO format)
    const parseDate = (peticion: string): Date | null => {
      try {
        if (!peticion || peticion.trim() === '') return null;
        const date = new Date(peticion);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    };

    // Log some date parsing examples
    if (validBookings.length > 0) {
      const sampleDates = validBookings.slice(0, 5).map(b => ({
        peticion: b.PETICION,
        parsed: parseDate(b.PETICION),
        canal: b.CANAL
      }));
      console.log('Sample date parsing:', JSON.stringify(sampleDates));
    }

    const dailyBookings = validBookings.filter(row => {
      const date = parseDate(row.PETICION);
      return date && date >= today;
    });

    const previousDayBookings = validBookings.filter(row => {
      const date = parseDate(row.PETICION);
      return date && date >= yesterday && date < today;
    });

    const weeklyBookings = validBookings.filter(row => {
      const date = parseDate(row.PETICION);
      return date && date >= weekAgo;
    });

    const previousWeekBookings = validBookings.filter(row => {
      const date = parseDate(row.PETICION);
      return date && date >= twoWeeksAgo && date < weekAgo;
    });

    const monthlyBookings = validBookings.filter(row => {
      const date = parseDate(row.PETICION);
      return date && date >= monthAgo;
    });

    const previousMonthBookings = validBookings.filter(row => {
      const date = parseDate(row.PETICION);
      return date && date >= twoMonthsAgo && date < monthAgo;
    });

    console.log(`Daily: ${dailyBookings.length}, Weekly: ${weeklyBookings.length}, Monthly: ${monthlyBookings.length}`);

    // Count by channel
    const countByChannel = (bookings: BookingRow[]) => {
      const whatsapp = bookings.filter(b => {
        const canal = b.CANAL?.toLowerCase() || '';
        return canal.includes('whatsapp') || canal.includes('whats');
      }).length;
      const crm = bookings.filter(b => {
        const canal = b.CANAL?.toLowerCase() || '';
        return canal.includes('crm');
      }).length;
      const web = bookings.filter(b => {
        const canal = b.CANAL?.toLowerCase() || '';
        return canal.includes('web') || canal.includes('internet');
      }).length;
      
      console.log(`Channel counts - WhatsApp: ${whatsapp}, CRM: ${crm}, Web: ${web}`);
      return { whatsapp, crm, web };
    };

    // Get average rating from reviews
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('approved', true);
    
    const averageRating = reviews && reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return new Response(
      JSON.stringify({
        daily: {
          total: dailyBookings.length,
          previous: previousDayBookings.length,
          byChannel: countByChannel(dailyBookings),
        },
        weekly: {
          total: weeklyBookings.length,
          previous: previousWeekBookings.length,
          byChannel: countByChannel(weeklyBookings),
        },
        monthly: {
          total: monthlyBookings.length,
          previous: previousMonthBookings.length,
          byChannel: countByChannel(monthlyBookings),
        },
        averageRating: Math.round(averageRating * 10) / 10,
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
