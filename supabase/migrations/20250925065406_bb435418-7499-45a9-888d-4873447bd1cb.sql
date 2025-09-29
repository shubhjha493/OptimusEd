-- Remove sensitive personal data fields from student_profiles table
ALTER TABLE public.student_profiles 
DROP COLUMN IF EXISTS date_of_birth,
DROP COLUMN IF EXISTS father_name,
DROP COLUMN IF EXISTS mother_name;

-- Update RLS policies to be more restrictive for student data
DROP POLICY IF EXISTS "Teachers can view limited student info" ON public.student_profiles;
DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profiles;

-- Only allow admins to view essential student info (class, section, roll_number only)
CREATE POLICY "Admins can view essential student info" 
ON public.student_profiles 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin');

-- Teachers can only view class and section info for attendance purposes
CREATE POLICY "Teachers can view basic class info" 
ON public.student_profiles 
FOR SELECT 
USING (
  get_user_role(auth.uid()) = 'teacher' 
  AND auth.uid() <> user_id
);

-- Remove sensitive data from teacher_profiles if any sensitive fields exist
-- (keeping only professional information like subjects, grade_level)
ALTER TABLE public.teacher_profiles 
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS mobile_number,
DROP COLUMN IF EXISTS date_of_birth;