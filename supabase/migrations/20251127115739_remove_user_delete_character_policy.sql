/*
  # Remove user delete character policy

  1. Changes
    - Remove the policy that allows users to delete their own draft characters
    - Only admins should be able to delete characters
  
  2. Security
    - Users can no longer delete characters
    - Admins retain full control through authenticated access
*/

DROP POLICY IF EXISTS "Users can delete own draft characters" ON characters;
