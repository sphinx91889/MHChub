/*
  # Create SOP Attachments Storage
  
  1. Changes
    - Create storage bucket for SOP attachments
    - Set up policies for file access and management
    - Allow PDF and image file uploads
    
  2. Security
    - Public read access for attachments
    - Authenticated users can upload files
    - Users can only delete their own files
*/

-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('sop-attachments', 'sop-attachments', true);

-- Create policy to allow authenticated users to upload files
create policy "authenticated_users_can_upload"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'sop-attachments'
  and (
    -- Allow only PDF and image files
    lower(right(name, 3)) = 'pdf'
    or lower(right(name, 3)) in ('png', 'jpg', 'gif')
    or lower(right(name, 4)) in ('jpeg', 'webp')
  )
);

-- Create policy to allow public read access
create policy "public_read_access"
on storage.objects for select
to public
using ( bucket_id = 'sop-attachments' );

-- Create policy to allow authenticated users to delete their own files
create policy "users_can_delete_own"
on storage.objects for delete
to authenticated
using ( 
  bucket_id = 'sop-attachments'
  and owner = auth.uid() 
);