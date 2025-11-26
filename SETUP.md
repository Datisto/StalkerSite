# STALKER RP Website Setup Guide

This guide will help you set up the STALKER RP website for DayZ Standalone.

## Prerequisites

- Node.js and npm installed
- Supabase account
- Steam API key (for Steam OpenID authentication)
- Discord webhook URL (optional, for notifications)

## 1. Database Setup

The database schema is defined in `database-schema.sql`. You need to execute this SQL in your Supabase project.

### Steps:

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `database-schema.sql`
4. Paste and execute the SQL
5. Verify all tables were created successfully

### Tables Created:

- `users` - User accounts linked to Steam
- `characters` - Player character profiles
- `admins` - Admin accounts
- `rules_questions` - Rules testing questions
- `rules_test_attempts` - User test attempts tracking
- `server_info` - Server information content
- `character_comments` - Admin comments on characters

## 2. Environment Variables

The `.env` file already contains Supabase credentials:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Steam Authentication

To implement Steam OpenID authentication, you need to:

1. Register your site at: https://steamcommunity.com/dev/apikey
2. Implement Steam OpenID flow using a backend service or Supabase Edge Function
3. After successful Steam login, create/update user in the `users` table

## 4. Install Dependencies

```bash
npm install
```

## 5. Run Development Server

```bash
npm run dev
```

## 6. Build for Production

```bash
npm run build
```

## Application Features

### For Players:

- **Landing Page** (`/`) - Server information, rules overview, faction info
- **Player Cabinet** (`/cabinet`) - Manage characters, view status
- **Character Creation** (`/character/new`) - Multi-step form to create characters
- **Rules Test** (`/rules-test`) - Test knowledge of server rules

### For Admins:

- **Admin Panel** (`/admin`) - Review and manage character applications
- Character approval/rejection workflow
- User management
- Statistics dashboard

## Seeding Test Data

### Add Rules Questions

To add questions for the rules test, insert into `rules_questions`:

```sql
INSERT INTO rules_questions (question_text, correct_answer, incorrect_answers, category, difficulty)
VALUES
  ('Що таке RDM?', 'Вбивство без roleplay причини', '["Вбивство за гроші", "Вбивство ворога", "Вбивство мутантів"]', 'Основні правила', 'easy'),
  ('Чи можна метагеймити?', 'Ні, це заборонено', '["Так, це дозволено", "Тільки з друзями", "Тільки в дискорді"]', 'Основні правила', 'easy');
```

### Create Admin Account

To create an admin account, you'll need to hash a password and insert into `admins`:

```sql
-- First, create a user or link to existing Steam user
-- Then insert admin record (password should be hashed using bcrypt)
INSERT INTO admins (username, password_hash, role)
VALUES ('admin', 'hashed_password_here', 'super_admin');
```

## Discord Integration

To enable Discord notifications:

1. Create a Discord webhook in your server
2. Create a Supabase Edge Function to send notifications
3. Trigger notifications on character status changes

## Google Sheets Integration

For syncing rules questions with Google Sheets:

1. Set up Google Sheets API credentials
2. Create a Supabase Edge Function to sync data
3. Schedule periodic sync or trigger manually

## Security Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Admins need proper authentication for admin panel access
- Steam authentication ensures legitimate users
- Character submissions go through approval process

## Troubleshooting

### Database Connection Issues

If you can't connect to Supabase:
- Verify `.env` file has correct credentials
- Check Supabase project status
- Ensure database tables are created

### Authentication Issues

If Steam login doesn't work:
- Verify Steam API key is valid
- Check callback URL configuration
- Ensure user creation logic is working

### Character Creation Issues

If characters aren't saving:
- Check browser console for errors
- Verify all required fields are filled
- Ensure user is authenticated
- Check RLS policies in Supabase

## Next Steps

1. Execute database schema
2. Set up Steam authentication
3. Add initial rules questions
4. Create admin accounts
5. Configure Discord webhooks
6. Test all functionality
7. Deploy to production

## Support

For issues or questions, please contact the development team.
