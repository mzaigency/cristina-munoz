-- Borrar perfil y rol de Cristina para permitir nuevo registro
DELETE FROM user_roles WHERE user_id = 'e6ecffa8-9428-47c9-81da-6a1b9a4bf09b';
DELETE FROM profiles WHERE id = 'e6ecffa8-9428-47c9-81da-6a1b9a4bf09b';

-- Borrar usuario de auth (esto permitirá un nuevo registro)
DELETE FROM auth.users WHERE id = 'e6ecffa8-9428-47c9-81da-6a1b9a4bf09b';