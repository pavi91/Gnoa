import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { mapFormResponseToMember } from '../utils/mapFormResponseToMember';

export const useMemberResponses = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  // Fetch initial responses and map to members
  const fetchMembers = async (reset = false) => {
    if (reset) {
      setPage(1);
      setMembers([]);
    }

    // Use setLoadingMore if it's not a reset
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      let query = supabase
        .from('form_responses')
        .select(`*`) 
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      // If not resetting, add range query for pagination
      if (!reset && members.length > 0) {
        const start = members.length;
        query = query.range(start, start + PAGE_SIZE - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log(`📥 Fetched ${data?.length || 0} form responses:`)
      
      // ✅ FIX IS HERE: We map, but we also manually ensure 'signature' is included
      // just in case the utility function missed it.
      const mappedMembers = data?.map(item => {
        const mapped = mapFormResponseToMember(item);
        return {
            ...mapped,
            // Explicitly attach the signature from the raw DB item
            signature: item.signature, 
            // Ensure status is present (defaulting to pending if missing)
            status: item.status || 'pending'
        };
      }) || [];

      console.log(`👥 Mapped ${mappedMembers.length} members:`, mappedMembers);

      setMembers(prev => reset ? mappedMembers : [...prev, ...mappedMembers]);
      setHasMore(data && data.length === PAGE_SIZE);
      setPage(prev => reset ? 1 : prev + 1);

    } catch (err) {
      console.error('❌ Error fetching member responses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Fetch more members
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    await fetchMembers(false);
  };

  // Refresh members
  const refresh = () => fetchMembers(true);

  // Filter members by status
  const getMembersByStatus = (status) => {
    return members.filter(member => member.status === status);
  };

  // Search members
  const searchMembers = (searchTerm) => {
    if (!searchTerm) return members;
    
    const term = searchTerm.toLowerCase();
    return members.filter(member => 
      member.fullName.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term) ||
      member.nicNumber?.includes(term) ||
      member.designation?.toLowerCase().includes(term)
    );
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchMembers(true);
  }, []);

  return {
    members,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    refetch: () => fetchMembers(true),
    getMembersByStatus,
    searchMembers,
    PAGE_SIZE
  };
};  