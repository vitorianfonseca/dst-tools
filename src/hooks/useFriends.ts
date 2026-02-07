 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { Profile } from "./useProfile";
 
 export interface Friendship {
   user_id: string;
   friend_id: string;
   created_at: string;
   friend?: Profile;
 }
 
 export interface FriendRequest {
   id: string;
   sender_id: string;
   receiver_id: string;
   status: "pending" | "accepted" | "rejected" | "cancelled";
   created_at: string;
   updated_at: string;
   sender?: Profile;
   receiver?: Profile;
 }
 
 export function useFriends() {
   const { user } = useAuth();
   const [friends, setFriends] = useState<Profile[]>([]);
   const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
   const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchFriends = useCallback(async () => {
     if (!user) {
       setFriends([]);
       setPendingRequests([]);
       setSentRequests([]);
       setLoading(false);
       return;
     }
 
     setLoading(true);
 
     // Fetch friendships where user is either user_id or friend_id
     const { data: friendships, error: friendshipsError } = await supabase
       .from("friendships")
       .select("*")
       .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
 
     if (friendshipsError) {
       console.error("Error fetching friendships:", friendshipsError);
     } else if (friendships && friendships.length > 0) {
       // Get friend IDs
       const friendIds = friendships.map((f) =>
         f.user_id === user.id ? f.friend_id : f.user_id
       );
 
       // Fetch friend profiles
       const { data: profiles, error: profilesError } = await supabase
         .from("profiles")
         .select("*")
         .in("id", friendIds);
 
       if (profilesError) {
         console.error("Error fetching friend profiles:", profilesError);
       } else {
         setFriends(profiles || []);
       }
     } else {
       setFriends([]);
     }
 
     // Fetch pending friend requests received
     const { data: receivedRequests, error: receivedError } = await supabase
       .from("friend_requests")
       .select("*")
       .eq("receiver_id", user.id)
       .eq("status", "pending");
 
     if (receivedError) {
       console.error("Error fetching received requests:", receivedError);
     } else if (receivedRequests && receivedRequests.length > 0) {
       // Fetch sender profiles
       const senderIds = receivedRequests.map((r) => r.sender_id);
       const { data: senderProfiles } = await supabase
         .from("profiles")
         .select("*")
         .in("id", senderIds);
 
       const requestsWithSenders = receivedRequests.map((r) => ({
         ...r,
         sender: senderProfiles?.find((p) => p.id === r.sender_id),
       }));
       setPendingRequests(requestsWithSenders as FriendRequest[]);
     } else {
       setPendingRequests([]);
     }
 
     // Fetch sent friend requests
     const { data: sent, error: sentError } = await supabase
       .from("friend_requests")
       .select("*")
       .eq("sender_id", user.id)
       .eq("status", "pending");
 
     if (sentError) {
       console.error("Error fetching sent requests:", sentError);
     } else if (sent && sent.length > 0) {
       const receiverIds = sent.map((r) => r.receiver_id);
       const { data: receiverProfiles } = await supabase
         .from("profiles")
         .select("*")
         .in("id", receiverIds);
 
       const requestsWithReceivers = sent.map((r) => ({
         ...r,
         receiver: receiverProfiles?.find((p) => p.id === r.receiver_id),
       }));
       setSentRequests(requestsWithReceivers as FriendRequest[]);
     } else {
       setSentRequests([]);
     }
 
     setLoading(false);
   }, [user]);
 
   useEffect(() => {
     fetchFriends();
   }, [fetchFriends]);
 
   const sendFriendRequest = async (receiverId: string) => {
     if (!user) return { error: new Error("Not authenticated") };
 
     const { error } = await supabase
       .from("friend_requests")
       .insert({ sender_id: user.id, receiver_id: receiverId, status: "pending" as const });
 
     if (!error) {
       await fetchFriends();
     }
 
     return { error };
   };
 
   const acceptFriendRequest = async (requestId: string) => {
     if (!user) return { error: new Error("Not authenticated") };
 
     // Get the request to find the sender
     const { data: request, error: fetchError } = await supabase
       .from("friend_requests")
       .select("*")
       .eq("id", requestId)
       .single();
 
     if (fetchError) return { error: fetchError };
 
     // Update request status
     const { error: updateError } = await supabase
       .from("friend_requests")
       .update({ status: "accepted" as const })
       .eq("id", requestId);
 
     if (updateError) return { error: updateError };
 
     // Create friendship (using service role would be better but we'll do client-side)
     const { error: friendshipError } = await supabase
       .from("friendships")
       .insert({ user_id: request.sender_id, friend_id: request.receiver_id });
 
     if (!friendshipError) {
       await fetchFriends();
     }
 
     return { error: friendshipError };
   };
 
   const rejectFriendRequest = async (requestId: string) => {
     const { error } = await supabase
       .from("friend_requests")
       .update({ status: "rejected" as const })
       .eq("id", requestId);
 
     if (!error) {
       await fetchFriends();
     }
 
     return { error };
   };
 
   const cancelFriendRequest = async (requestId: string) => {
     const { error } = await supabase
       .from("friend_requests")
       .delete()
       .eq("id", requestId);
 
     if (!error) {
       await fetchFriends();
     }
 
     return { error };
   };
 
   const removeFriend = async (friendId: string) => {
     if (!user) return { error: new Error("Not authenticated") };
 
     const { error } = await supabase
       .from("friendships")
       .delete()
       .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
 
     if (!error) {
       await fetchFriends();
     }
 
     return { error };
   };
 
   return {
     friends,
     pendingRequests,
     sentRequests,
     loading,
     sendFriendRequest,
     acceptFriendRequest,
     rejectFriendRequest,
     cancelFriendRequest,
     removeFriend,
     refetch: fetchFriends,
   };
 }