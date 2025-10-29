-- Giv louisebencard@hotmail.com admin-rettigheder
INSERT INTO public.user_roles (user_id, role) 
VALUES ('91f01c57-dfa2-402d-b2ad-b5fc979fe0b7', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;