# Supabase Setup Instructions

This document provides step-by-step instructions for setting up the Supabase backend for the Family Tree Application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Access to the Supabase dashboard

## Step 1: Create a New Supabase Project

1. Log in to your Supabase dashboard
2. Click "New Project"
3. Fill in the project details:
   - **Name**: family-tree-app (or your preferred name)
   - **Database Password**: Choose a strong password (save this securely)
   - **Region**: Select the region closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (this may take a few minutes)

## Step 2: Run Database Migrations

1. In the Supabase dashboard, navigate to the **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy and paste the contents of `supabase/migrations/001_create_members_table.sql`
4. Click "Run" to execute the migration
5. Verify the members table was created successfully
6. Create another new query
7. Copy and paste the contents of `supabase/migrations/002_create_relationships_table.sql`
8. Click "Run" to execute the migration
9. Verify the relationships table was created successfully

### Verify Tables

Navigate to **Table Editor** in the left sidebar to confirm both tables exist:
- `members` table with columns: id, name, birth_date, birthplace, photo_url, created_at, updated_at
- `relationships` table with columns: id, member_id, related_member_id, relationship_type, created_at

## Step 3: Create Storage Bucket for Member Photos

1. In the Supabase dashboard, navigate to **Storage** (left sidebar)
2. Click "Create a new bucket"
3. Configure the bucket:
   - **Name**: `member-photos`
   - **Public bucket**: Toggle ON (to allow public access to photos)
4. Click "Create bucket"

### Configure Storage Policies

1. Click on the `member-photos` bucket
2. Navigate to the **Policies** tab
3. Click "New policy"
4. Select "For full customization" and create the following policies:

**Policy 1: Allow public read access**
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-photos');
```

**Policy 2: Allow public insert**
```sql
CREATE POLICY "Public insert access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'member-photos');
```

**Policy 3: Allow public update**
```sql
CREATE POLICY "Public update access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'member-photos');
```

**Policy 4: Allow public delete**
```sql
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'member-photos');
```

### Configure File Upload Restrictions

1. In the bucket settings, configure the following:
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
   - **Max file size**: 5 MB (5242880 bytes)

Note: These restrictions should also be enforced in the application code for better user experience.

## Step 4: Get API Credentials

1. Navigate to **Project Settings** (gear icon in left sidebar)
2. Click on **API** in the settings menu
3. Copy the following values:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 5: Configure Environment Variables

1. In your Next.js project root, create or update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the placeholder values with your actual credentials from Step 4
3. Never commit `.env.local` to version control (it should be in `.gitignore`)

## Step 6: Configure Vercel Environment Variables (for deployment)

When deploying to Vercel:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the same two variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Make sure they are available for all environments (Production, Preview, Development)

## Verification

To verify your setup is complete:

1. Check that both database tables exist in the Table Editor
2. Check that the `member-photos` bucket exists in Storage
3. Verify that your `.env.local` file has the correct credentials
4. Test the connection by running your Next.js application

## Security Notes

- The current setup uses public access for simplicity during the family reunion
- For a production application, consider implementing:
  - Supabase Authentication
  - Row Level Security (RLS) policies
  - User-specific access controls
  - Private storage buckets with signed URLs

## Troubleshooting

### Tables not created
- Ensure you ran both migration files in order
- Check the SQL Editor for error messages
- Verify you have the correct permissions

### Storage bucket not accessible
- Verify the bucket is set to "Public"
- Check that all storage policies are created correctly
- Ensure the bucket name is exactly `member-photos`

### Connection errors
- Double-check your environment variables
- Ensure the Supabase project is active and not paused
- Verify the Project URL and API key are correct

## Next Steps

After completing this setup, you can proceed with implementing the application code that will interact with these database tables and storage bucket.
