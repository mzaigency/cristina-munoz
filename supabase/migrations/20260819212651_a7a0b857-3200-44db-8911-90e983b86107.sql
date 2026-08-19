-- Excepciones de horario aplicables solo a ciertos días de la semana.
--
-- Hasta ahora una excepción era un rango de fechas y punto, así que una
-- "jornada intensiva" de agosto se aplicaba también a los días que el salón
-- tiene cerrados. No había forma de decir "de lunes a viernes" ni de excluir
-- un festivo sin crear una excepción aparte para cada uno.
--
-- NULL = todos los días del rango. Así las excepciones que ya existen siguen
-- comportándose igual y no hace falta migrar datos.
alter table public.tenant_hours_overrides
  add column if not exists days_of_week smallint[];

comment on column public.tenant_hours_overrides.days_of_week is
  'Días de la semana a los que aplica la excepción (0=domingo … 6=sábado). NULL = todos.';

-- Solo valores de día válidos.
alter table public.tenant_hours_overrides
  drop constraint if exists tenant_hours_overrides_days_of_week_valid;

alter table public.tenant_hours_overrides
  add constraint tenant_hours_overrides_days_of_week_valid
  check (
    days_of_week is null
    or (
      array_length(days_of_week, 1) between 1 and 7
      and days_of_week <@ array[0,1,2,3,4,5,6]::smallint[]
    )
  );