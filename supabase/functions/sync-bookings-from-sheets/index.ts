import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SheetRow {
  NOMBRE: string;
  RECORDATORIO: string; // Fecha
  TELÉFONO: string;
  HORA: string;
  VALORACION: string;
  PETICIÓN: string;
  SERVICIO: string;
  CANAL: string;
  'ID_Parte 1': string;
  'ID_Parte 2': string;
  'ID_Parte 3': string;
  'ID_Parte 4': string;
  'ID_Parte 5': string;
  'CALENDAR ID': string;
}

async function getAccessToken() {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function fetchSheetData(accessToken: string, spreadsheetId: string): Promise<SheetRow[]> {
  const range = 'A2:N'; // Skip header row, read all data columns
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
  }

  const data = await response.json();
  const rows: SheetRow[] = [];

  if (data.values) {
    for (const row of data.values) {
      // Skip empty rows
      if (!row[0] || !row[1] || !row[2] || !row[3]) continue;

      rows.push({
        NOMBRE: row[0] || '',
        RECORDATORIO: row[1] || '',
        TELÉFONO: row[2] || '',
        HORA: row[3] || '',
        VALORACION: row[4] || '',
        PETICIÓN: row[5] || '',
        SERVICIO: row[6] || '',
        CANAL: row[7] || '',
        'ID_Parte 1': row[8] || '',
        'ID_Parte 2': row[9] || '',
        'ID_Parte 3': row[10] || '',
        'ID_Parte 4': row[11] || '',
        'ID_Parte 5': row[12] || '',
        'CALENDAR ID': row[13] || '',
      });
    }
  }

  return rows;
}

function parseDateFromRecordatorio(recordatorio: string): string | null {
  // Handle different date formats: "21/11/2025", "2025-11-21", etc.
  try {
    // Try DD/MM/YYYY format first
    const parts = recordatorio.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    
    // Try YYYY-MM-DD format
    if (recordatorio.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return recordatorio;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', recordatorio, error);
    return null;
  }
}

function parseTime(hora: string): string | null {
  // Handle formats like "15:00", "3:00 PM", etc.
  try {
    // Remove spaces and convert to lowercase
    hora = hora.trim().toLowerCase();
    
    // Handle HH:MM format
    if (hora.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = hora.split(':');
      return `${hours.padStart(2, '0')}:${minutes}:00`;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing time:', hora, error);
    return null;
  }
}

function determineStylist(calendarId: string): string {
  const crisCalendarId = Deno.env.get('GOOGLE_CALENDAR_ID_CRIS');
  const desiCalendarId = Deno.env.get('GOOGLE_CALENDAR_ID_DESI');
  
  if (calendarId === crisCalendarId) return 'cristina';
  if (calendarId === desiCalendarId) return 'desi';
  
  // Default to cristina if not found
  return 'cristina';
}

function parseServices(servicio: string): any[] {
  // Parse service string to JSON format
  // Expected format: "Corte", "Corte + Color", etc.
  const services = servicio.split('+').map(s => s.trim());
  return services.map((name, index) => ({
    id: `service-${index}`,
    name: name,
    duration: 60, // Default duration
    type: 'active',
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Google Sheets sync...');

    // Get environment variables
    const spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!spreadsheetId || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get access token
    console.log('Getting Google access token...');
    const accessToken = await getAccessToken();

    // Fetch sheet data
    console.log('Fetching data from Google Sheets...');
    const rows = await fetchSheetData(accessToken, spreadsheetId);
    console.log(`Found ${rows.length} rows in the sheet`);

    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Parse date and time
        const fecha = parseDateFromRecordatorio(row.RECORDATORIO);
        const hora = parseTime(row.HORA);

        if (!fecha || !hora) {
          console.warn(`Skipping row - invalid date/time: ${row.NOMBRE} ${row.RECORDATORIO} ${row.HORA}`);
          errorCount++;
          errors.push(`Invalid date/time for ${row.NOMBRE}: ${row.RECORDATORIO} ${row.HORA}`);
          continue;
        }

        // Only sync future bookings or today's bookings
        const today = new Date().toISOString().split('T')[0];
        if (fecha < today) {
          continue; // Skip past bookings
        }

        // Determine stylist from calendar ID
        const stylist = determineStylist(row['CALENDAR ID']);

        // Parse services
        const services = parseServices(row.SERVICIO);
        const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

        // Calculate end time
        const [hours, minutes] = hora.split(':').map(Number);
        const endMinutes = hours * 60 + minutes + totalDuration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;

        // Handle multiple parts (compound bookings)
        const parts = [
          row['ID_Parte 1'],
          row['ID_Parte 2'],
          row['ID_Parte 3'],
          row['ID_Parte 4'],
          row['ID_Parte 5'],
        ].filter(id => id && id.trim() !== '');

        if (parts.length === 0) {
          console.warn(`Skipping row - no calendar event IDs: ${row.NOMBRE}`);
          errorCount++;
          errors.push(`No calendar IDs for ${row.NOMBRE}`);
          continue;
        }

        // Use the first part ID as the primary identifier
        const primaryEventId = parts[0];
        
        // Check if booking already exists
        const { data: existingBooking } = await supabase
          .from('bookings')
          .select('id')
          .eq('google_calendar_event_id', primaryEventId)
          .eq('Fecha', fecha)
          .single();

        const bookingData = {
          customer_name: row.NOMBRE,
          Telefono: row.TELÉFONO,
          Fecha: fecha,
          Hora: hora,
          end_time: endTime,
          stylist: stylist,
          services: services,
          total_duration: totalDuration,
          google_calendar_event_id: primaryEventId,
          calendar_id: row['CALENDAR ID'],
          is_part_of_compound: parts.length > 1,
          compound_part: parts.length > 1 ? 'part1' : null,
          status: 'confirmed',
        };

        if (existingBooking) {
          // Update existing booking
          const { error: updateError } = await supabase
            .from('bookings')
            .update(bookingData)
            .eq('id', existingBooking.id);

          if (updateError) {
            console.error('Error updating booking:', updateError);
            errorCount++;
            errors.push(`Update failed for ${row.NOMBRE}: ${updateError.message}`);
          } else {
            console.log(`Updated booking: ${row.NOMBRE} on ${fecha} at ${hora}`);
            syncedCount++;
          }
        } else {
          // Insert new booking
          const { error: insertError } = await supabase
            .from('bookings')
            .insert(bookingData);

          if (insertError) {
            console.error('Error inserting booking:', insertError);
            errorCount++;
            errors.push(`Insert failed for ${row.NOMBRE}: ${insertError.message}`);
          } else {
            console.log(`Inserted booking: ${row.NOMBRE} on ${fecha} at ${hora}`);
            syncedCount++;
          }
        }

        // Handle additional parts for compound bookings
        if (parts.length > 1) {
          for (let i = 1; i < parts.length; i++) {
            const partEventId = parts[i];
            
            // Check if this part exists
            const { data: existingPart } = await supabase
              .from('bookings')
              .select('id')
              .eq('google_calendar_event_id', partEventId)
              .eq('Fecha', fecha)
              .single();

            const partData = {
              ...bookingData,
              google_calendar_event_id: partEventId,
              compound_part: `part${i + 1}`,
              is_part_of_compound: true,
            };

            if (existingPart) {
              await supabase
                .from('bookings')
                .update(partData)
                .eq('id', existingPart.id);
            } else {
              await supabase
                .from('bookings')
                .insert(partData);
            }
          }
        }
      } catch (error) {
        console.error('Error processing row:', error);
        errorCount++;
        errors.push(`Error processing ${row.NOMBRE}: ${error.message}`);
      }
    }

    console.log(`Sync completed: ${syncedCount} bookings synced, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synchronized ${syncedCount} bookings from Google Sheets`,
        synced: syncedCount,
        errors: errorCount,
        errorDetails: errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in sync-bookings-from-sheets:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
