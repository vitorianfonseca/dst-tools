-- Add email column to profiles table to ensure uniqueness
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update existing profiles to have consistent data
UPDATE public.profiles
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL;
