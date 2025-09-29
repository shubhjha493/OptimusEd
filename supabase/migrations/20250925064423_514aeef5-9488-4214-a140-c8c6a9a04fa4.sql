-- Remove sensitive data columns from teacher and student profiles
ALTER TABLE public.teacher_profiles DROP COLUMN IF EXISTS aadhar_number;
ALTER TABLE public.student_profiles DROP COLUMN IF EXISTS aadhar_number;

-- Update RLS policies to be more restrictive for student data
DROP POLICY IF EXISTS "Teachers and Admins can view student profiles" ON public.student_profiles;

-- Create more restrictive policy - only admins can view all student profiles
CREATE POLICY "Admins can view all student profiles" 
ON public.student_profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::text);

-- Teachers can only view limited student info (no personal details)
CREATE POLICY "Teachers can view limited student info" 
ON public.student_profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'teacher'::text 
  AND auth.uid() != user_id  -- Ensure they're not viewing their own profile as a student
);

-- Restrict system settings to only authenticated admins
DROP POLICY IF EXISTS "Everyone can view system settings" ON public.system_settings;

CREATE POLICY "Only admins can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::text);