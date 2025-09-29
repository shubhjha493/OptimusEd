-- Add RLS policy to allow admins to view all profiles for administrative purposes
-- This follows the same pattern used in other tables like student_profiles and teacher_profiles

CREATE POLICY "Admins can view all profiles for administrative purposes" 
ON public.profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::text);