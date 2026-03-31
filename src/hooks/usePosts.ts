import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface Post {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  tenant_slug?: string;
  tenant_logo?: string;
  image_url: string;
  caption: string | null;
  category: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked?: boolean;
}

export function usePosts(tenantId?: string) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get posts for a specific tenant
  const { data: tenantPosts = [], isLoading: isLoadingTenantPosts, refetch: refetchTenantPosts } = useQuery({
    queryKey: ["posts", "tenant", tenantId, userId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data: posts, error } = await supabase
        .from("posts")
        .select(`
          id,
          tenant_id,
          image_url,
          caption,
          category,
          likes_count,
          comments_count,
          created_at
        `)
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get like status for each post if user is authenticated
      if (userId && posts.length > 0) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", posts.map(p => p.id));

        const likedPostIds = new Set(likes?.map(l => l.post_id) || []);
        return posts.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id)
        })) as Post[];
      }

      return posts as Post[];
    },
    enabled: !!tenantId,
  });

  // Get posts from followed tenants (for feed)
  const { data: followingPosts = [], isLoading: isLoadingFollowingPosts, refetch: refetchFollowingPosts } = useQuery({
    queryKey: ["posts", "following", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .rpc("get_following_posts", { 
          _user_id: userId, 
          _limit: 50, 
          _offset: 0 
        });

      if (error) throw error;
      return (data || []) as Post[];
    },
    enabled: !!userId,
  });

  // Like a post
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // Unlike a post
  const unlikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!userId) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const toggleLike = (postId: string, isCurrentlyLiked: boolean) => {
    if (!userId) {
      toast({ 
        title: "Inicia sesión", 
        description: "Necesitas una cuenta para dar like" 
      });
      return;
    }
    if (isCurrentlyLiked) {
      unlikeMutation.mutate(postId);
    } else {
      likeMutation.mutate(postId);
    }
  };

  // Create a post (for admins)
  const createPostMutation = useMutation({
    mutationFn: async ({ 
      tenantId, 
      imageUrl, 
      caption, 
      category 
    }: { 
      tenantId: string; 
      imageUrl: string; 
      caption?: string; 
      category?: string; 
    }) => {
      if (!userId) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("posts")
        .insert({ 
          tenant_id: tenantId, 
          created_by: userId,
          image_url: imageUrl, 
          caption, 
          category 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "¡Publicación creada!" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo crear la publicación", variant: "destructive" });
    },
  });

  // Delete a post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast({ title: "Publicación eliminada" });
    },
  });

  return {
    tenantPosts,
    followingPosts,
    isLoadingTenantPosts,
    isLoadingFollowingPosts,
    toggleLike,
    createPost: createPostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    isCreating: createPostMutation.isPending,
    refetchTenantPosts,
    refetchFollowingPosts,
    isAuthenticated: !!userId,
  };
}
