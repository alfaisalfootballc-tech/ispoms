-- Create document status enum
CREATE TYPE public.document_status AS ENUM ('draft', 'published', 'archived');

-- Create document access level enum
CREATE TYPE public.access_level AS ENUM ('view', 'edit', 'admin');

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    status document_status NOT NULL DEFAULT 'draft',
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document versions table for version control
CREATE TABLE public.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    change_notes TEXT,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(document_id, version)
);

-- Create document access table for granular permissions
CREATE TABLE public.document_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    access_level access_level NOT NULL DEFAULT 'view',
    granted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(document_id, user_id)
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access ENABLE ROW LEVEL SECURITY;

-- Helper function to check document access
CREATE OR REPLACE FUNCTION public.can_access_document(_document_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _document_id
    AND (
      d.is_public = true
      OR d.uploaded_by = _user_id
      OR EXISTS (SELECT 1 FROM public.document_access da WHERE da.document_id = _document_id AND da.user_id = _user_id)
      OR public.is_admin()
      OR (public.is_manager() AND d.department_id = public.get_user_department_id())
    )
  )
$$;

-- Helper function to check edit access
CREATE OR REPLACE FUNCTION public.can_edit_document(_document_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.id = _document_id
    AND (
      d.uploaded_by = _user_id
      OR EXISTS (SELECT 1 FROM public.document_access da WHERE da.document_id = _document_id AND da.user_id = _user_id AND da.access_level IN ('edit', 'admin'))
      OR public.is_admin()
    )
  )
$$;

-- RLS Policies for documents
CREATE POLICY "Users can view accessible documents"
ON public.documents FOR SELECT
TO authenticated
USING (public.can_access_document(id, auth.uid()));

CREATE POLICY "Authenticated users can upload documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update documents they can edit"
ON public.documents FOR UPDATE
TO authenticated
USING (public.can_edit_document(id, auth.uid()));

CREATE POLICY "Admins and owners can delete documents"
ON public.documents FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid() OR public.is_admin());

-- RLS Policies for document_versions
CREATE POLICY "Users can view versions of accessible documents"
ON public.document_versions FOR SELECT
TO authenticated
USING (public.can_access_document(document_id, auth.uid()));

CREATE POLICY "Users can create versions of editable documents"
ON public.document_versions FOR INSERT
TO authenticated
WITH CHECK (public.can_edit_document(document_id, auth.uid()));

-- RLS Policies for document_access
CREATE POLICY "Users can view their own access grants"
ON public.document_access FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.can_edit_document(document_id, auth.uid())
);

CREATE POLICY "Document editors can grant access"
ON public.document_access FOR INSERT
TO authenticated
WITH CHECK (public.can_edit_document(document_id, auth.uid()));

CREATE POLICY "Document editors can update access"
ON public.document_access FOR UPDATE
TO authenticated
USING (public.can_edit_document(document_id, auth.uid()));

CREATE POLICY "Document editors can revoke access"
ON public.document_access FOR DELETE
TO authenticated
USING (public.can_edit_document(document_id, auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv', 'image/jpeg', 'image/png', 'image/gif', 'application/zip']
);

-- Storage policies
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their own uploaded documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own uploaded documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can access all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND public.is_admin());

CREATE POLICY "Admins can delete any document"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND public.is_admin());