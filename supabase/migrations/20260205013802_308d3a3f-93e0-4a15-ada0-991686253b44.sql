-- Add policy to allow creating friendships when accepting a request
CREATE POLICY "Users can create friendships from accepted requests"
  ON public.friendships FOR INSERT
  WITH CHECK (
    user_id = auth.uid() OR friend_id = auth.uid()
  );