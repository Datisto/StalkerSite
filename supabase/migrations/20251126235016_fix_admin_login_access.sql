/*
  # Виправлення доступу до таблиці admins для логіну

  Додаємо політику для анонімного доступу при логіні.
*/

CREATE POLICY "Allow anonymous login"
  ON admins
  FOR SELECT
  TO anon
  USING (is_active = true);
