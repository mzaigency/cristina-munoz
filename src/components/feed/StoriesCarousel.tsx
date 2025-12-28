import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Play, Pause, Plus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useCurrentUserTenant } from "@/hooks/useCurrentUserTenant";
import { StoryCreator } from "./StoryCreator";
import { StoryReplyInput } from "./StoryReplyInput";
import { useNavigation } from "@/contexts/NavigationContext";

interface Story {
  id: string;
  tenant_id: string;
  image_url: string;
  caption: string | null;
  story_type: string;
  created_at: string;
  tenant: {
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
  };
}

interface StoryGroup {
  tenant_id: string;
  tenant: Story["tenant"];
  stories: Story[];
  hasUnviewed: boolean;
}

export function StoriesCarousel() {
  const [selectedGroup, setSelectedGroup] = useState<StoryGroup | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCreator, setShowCreator] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  
  const { tenantId, tenant, loading: tenantLoading } = useCurrentUserTenant();
  const { setNavigationHidden } = useNavigation();
  const queryClient = useQueryClient();

  const { data: storyGroups = [], isLoading } = useQuery({
    queryKey: ["salon-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salon_stories")
        .select(`
          id,
          tenant_id,
          image_url,
          caption,
          story_type,
          created_at,
          tenant:tenants!inner (
            name,
            slug,
            logo_url,
            primary_color
          )
        `)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group stories by tenant
      const grouped = (data || []).reduce((acc, story) => {
        const existing = acc.find((g) => g.tenant_id === story.tenant_id);
        if (existing) {
          existing.stories.push(story as Story);
        } else {
          acc.push({
            tenant_id: story.tenant_id,
            tenant: story.tenant as Story["tenant"],
            stories: [story as Story],
            hasUnviewed: true,
          });
        }
        return acc;
      }, [] as StoryGroup[]);

      return grouped;
    },
  });

  // Hide navigation when viewing/creating stories
  useEffect(() => {
    setNavigationHidden(!!selectedGroup || showCreator);
  }, [selectedGroup, showCreator, setNavigationHidden]);

  // Pause progress when reply input is open
  useEffect(() => {
    if (showReplyInput) {
      setIsPaused(true);
    }
  }, [showReplyInput]);

  // Auto-progress timer
  useEffect(() => {
    if (selectedGroup && !isPaused) {
      progressInterval.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            if (currentStoryIndex < selectedGroup.stories.length - 1) {
              setCurrentStoryIndex((i) => i + 1);
              return 0;
            } else {
              setSelectedGroup(null);
              return 0;
            }
          }
          return p + 2;
        });
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [selectedGroup, isPaused, currentStoryIndex]);

  const handleStoryClick = (group: StoryGroup) => {
    setSelectedGroup(group);
    setCurrentStoryIndex(0);
    setProgress(0);
    setShowReplyInput(false);
  };

  const handleClose = () => {
    setSelectedGroup(null);
    setProgress(0);
    setCurrentStoryIndex(0);
    setShowReplyInput(false);
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((i) => i - 1);
      setProgress(0);
    }
  };

  const handleNextStory = () => {
    if (selectedGroup && currentStoryIndex < selectedGroup.stories.length - 1) {
      setCurrentStoryIndex((i) => i + 1);
      setProgress(0);
    } else {
      handleClose();
    }
  };

  const handleStoryCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["salon-stories"] });
  };

  const toggleReplyInput = () => {
    setShowReplyInput(!showReplyInput);
    setIsPaused(!showReplyInput);
  };

  if (isLoading || tenantLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-hide">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full bg-secondary animate-pulse" />
            <div className="w-12 h-3 bg-secondary rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const canCreateStory = !!tenantId;
  
  if (storyGroups.length === 0 && !canCreateStory) {
    return null;
  }

  const currentStory = selectedGroup?.stories[currentStoryIndex];

  return (
    <>
      {/* Story Creator Modal */}
      {canCreateStory && (
        <StoryCreator
          isOpen={showCreator}
          onClose={() => setShowCreator(false)}
          tenantId={tenantId}
          onSuccess={handleStoryCreated}
        />
      )}

      {/* Stories Carousel */}
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {/* Add Story Button for admins/stylists */}
          {canCreateStory && tenant && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setShowCreator(true)}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div className="relative w-16 h-16 rounded-full bg-secondary p-0.5">
                <div className="w-full h-full rounded-full bg-background p-0.5 relative">
                  {tenant.logo_url ? (
                    <img
                      src={tenant.logo_url}
                      alt={tenant.name}
                      className="w-full h-full rounded-full object-cover opacity-70"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold opacity-70"
                      style={{ background: tenant.primary_color || "#6366f1" }}
                    >
                      {tenant.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Plus className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Tu story</span>
            </motion.button>
          )}
          {storyGroups.map((group, index) => {
            const initials = group.tenant.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            const primaryColor = group.tenant.primary_color || "#6366f1";

            return (
              <motion.button
                key={group.tenant_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleStoryClick(group)}
                className="flex flex-col items-center gap-2 shrink-0"
              >
                <div
                  className={cn(
                    "relative w-16 h-16 rounded-full p-0.5",
                    group.hasUnviewed
                      ? "bg-gradient-to-br from-rose-500 via-purple-500 to-blue-500"
                      : "bg-secondary"
                  )}
                >
                  <div className="w-full h-full rounded-full bg-background p-0.5">
                    {group.tenant.logo_url ? (
                      <img
                        src={group.tenant.logo_url}
                        alt={group.tenant.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: primaryColor }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>
                  {group.stories.length > 1 && (
                    <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {group.stories.length}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground font-medium truncate max-w-16">
                  {group.tenant.name.split(" ")[0]}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedGroup && currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full h-full max-w-lg mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bars */}
              <div className="absolute top-4 left-4 right-4 z-10 flex gap-1">
                {selectedGroup.stories.map((_, i) => (
                  <div key={i} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white"
                      initial={{ width: 0 }}
                      animate={{
                        width:
                          i < currentStoryIndex
                            ? "100%"
                            : i === currentStoryIndex
                            ? `${progress}%`
                            : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 z-10 flex items-center justify-between">
                <Link
                  to={`/salon/${selectedGroup.tenant.slug}`}
                  className="flex items-center gap-3"
                  onClick={handleClose}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 overflow-hidden">
                    {selectedGroup.tenant.logo_url ? (
                      <img
                        src={selectedGroup.tenant.logo_url}
                        alt={selectedGroup.tenant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                        {selectedGroup.tenant.name[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{selectedGroup.tenant.name}</p>
                    <p className="text-white/60 text-xs">
                      {new Date(currentStory.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {isPaused ? (
                      <Play className="w-5 h-5 text-white" />
                    ) : (
                      <Pause className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Story Image */}
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentStory.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  src={currentStory.image_url}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </AnimatePresence>

              {/* Caption */}
              {currentStory.caption && !showReplyInput && (
                <div className="absolute bottom-32 left-4 right-4 z-10">
                  <p className="text-white text-center text-lg font-medium drop-shadow-lg">
                    {currentStory.caption}
                  </p>
                </div>
              )}

              {/* Navigation Areas */}
              <button
                className="absolute left-0 top-20 bottom-32 w-1/3"
                onClick={handlePrevStory}
              >
                {currentStoryIndex > 0 && (
                  <ChevronLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 text-white/50" />
                )}
              </button>
              <button
                className="absolute right-0 top-20 bottom-32 w-1/3"
                onClick={handleNextStory}
              >
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 text-white/50" />
              </button>

              {/* Bottom actions - Reply or View Salon */}
              {!showReplyInput ? (
                <div className="absolute bottom-6 left-4 right-4 z-10 flex gap-3">
                  <button
                    onClick={toggleReplyInput}
                    className="flex-1 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white font-medium text-center hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/20"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Responder
                  </button>
                  <Link
                    to={`/salon/${selectedGroup.tenant.slug}`}
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-full bg-white text-black font-semibold text-center hover:bg-white/90 transition-colors"
                  >
                    Ver Salón
                  </Link>
                </div>
              ) : (
                <StoryReplyInput
                  tenantId={selectedGroup.tenant_id}
                  tenantName={selectedGroup.tenant.name}
                  storyId={currentStory.id}
                  onClose={() => {
                    setShowReplyInput(false);
                    setIsPaused(false);
                  }}
                  onSent={() => {
                    setShowReplyInput(false);
                    setIsPaused(false);
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}