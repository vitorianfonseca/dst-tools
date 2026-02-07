-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  banner_url TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create visibility enum for workspaces
CREATE TYPE workspace_visibility AS ENUM ('public', 'private');

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  visibility workspace_visibility NOT NULL DEFAULT 'private',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create friendships table (bidirectional)
CREATE TABLE public.friendships (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Create friend request status enum
CREATE TYPE friend_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

-- Create friend requests table
CREATE TABLE public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status friend_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT unique_pending_request UNIQUE (sender_id, receiver_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- Helper function to check if two users are friends
CREATE OR REPLACE FUNCTION public.is_friend(user_a_id UUID, user_b_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE (user_id = user_a_id AND friend_id = user_b_id)
       OR (user_id = user_b_id AND friend_id = user_a_id)
  )
$$;

-- Profiles RLS Policies
CREATE POLICY "Users can view public profiles or their own or friends"
  ON public.profiles FOR SELECT
  USING (
    NOT is_private 
    OR id = auth.uid() 
    OR public.is_friend(id, auth.uid())
  );

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (id = auth.uid());

-- Workspaces RLS Policies
CREATE POLICY "Users can view public workspaces or their own or friends"
  ON public.workspaces FOR SELECT
  USING (
    visibility = 'public' 
    OR user_id = auth.uid() 
    OR public.is_friend(user_id, auth.uid())
  );

CREATE POLICY "Users can create their own workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workspaces"
  ON public.workspaces FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workspaces"
  ON public.workspaces FOR DELETE
  USING (user_id = auth.uid());

-- Friendships RLS Policies
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can delete their own friendships"
  ON public.friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Friend Requests RLS Policies
CREATE POLICY "Users can view friend requests they sent or received"
  ON public.friend_requests FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND status = 'pending');

CREATE POLICY "Receivers can update pending requests"
  ON public.friend_requests FOR UPDATE
  USING (receiver_id = auth.uid() AND status = 'pending');

CREATE POLICY "Users can delete their own requests"
  ON public.friend_requests FOR DELETE
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_workspaces_user_id ON public.workspaces(user_id);
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friend_requests_sender_id ON public.friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver_id ON public.friend_requests(receiver_id);
CREATE INDEX idx_friend_requests_status ON public.friend_requests(status);