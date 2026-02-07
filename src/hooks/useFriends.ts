import { useState, useEffect, useCallback } from "react";
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
    setFriends([]);
    setPendingRequests([]);
    setSentRequests([]);
     setLoading(false);
   }, [user]);
 
   useEffect(() => {
     fetchFriends();
   }, [fetchFriends]);
 
   const sendFriendRequest = async (receiverId: string) => {
     if (!user) return { error: new Error("Not authenticated") };
    return { error: null };
   };
 
   const acceptFriendRequest = async (requestId: string) => {
     if (!user) return { error: new Error("Not authenticated") };
    return { error: null };
   };
 
   const rejectFriendRequest = async (requestId: string) => {
    return { error: null };
   };
 
   const cancelFriendRequest = async (requestId: string) => {
    return { error: null };
   };
 
   const removeFriend = async (friendId: string) => {
     if (!user) return { error: new Error("Not authenticated") };
    return { error: null };
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