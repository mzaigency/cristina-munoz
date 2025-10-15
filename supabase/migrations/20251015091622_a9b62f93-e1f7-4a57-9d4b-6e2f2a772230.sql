-- Rename booking_date column to Fecha
ALTER TABLE bookings RENAME COLUMN booking_date TO "Fecha";

-- Rename booking_time column to Hora
ALTER TABLE bookings RENAME COLUMN booking_time TO "Hora";