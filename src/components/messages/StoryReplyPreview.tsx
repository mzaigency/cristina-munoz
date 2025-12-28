import { useState, useEffect } from 'react';
import { Image, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface StoryReplyPreviewProps {
  storyId: string;
  isOwn: boolean;
}

interface StoryData {
  id: string;
  image_url: string;
  caption: string | null;
  tenant: {
    name: string;
    logo_url: string | null;
  } | null;
}

export function StoryReplyPreview({ storyId, isOwn }: StoryReplyPreviewProps) {
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        // Fetch story with tenant info - include expired stories for context
        const { data, error: fetchError } = await supabase
          .from('salon_stories')
          .select(`
            id,
            image_url,
            caption,
            tenant:tenants(name, logo_url)
          `)
          .eq('id', storyId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        if (data) {
          setStory(data as StoryData);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching story:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId]);

  if (loading) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-lg mb-2',
        isOwn ? 'bg-primary-foreground/10' : 'bg-muted/50'
      )}>
        <div className="w-12 h-16 rounded-md bg-muted animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          <div className="h-2 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className={cn(
        'flex items-center gap-2 p-2 rounded-lg mb-2',
        isOwn ? 'bg-primary-foreground/10' : 'bg-muted/50'
      )}>
        <div className={cn(
          'w-12 h-16 rounded-md flex items-center justify-center',
          isOwn ? 'bg-primary-foreground/20' : 'bg-muted'
        )}>
          <Image className={cn(
            'h-5 w-5',
            isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground'
          )} />
        </div>
        <div className="flex-1">
          <p className={cn(
            'text-xs font-medium',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}>
            Historia no disponible
          </p>
          <p className={cn(
            'text-[10px]',
            isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground/70'
          )}>
            La historia ha expirado o fue eliminada
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-lg mb-2 cursor-pointer transition-all hover:opacity-80',
      isOwn ? 'bg-primary-foreground/10' : 'bg-muted/50'
    )}>
      {/* Story thumbnail */}
      <div className="relative w-12 h-16 rounded-md overflow-hidden shrink-0">
        <img
          src={story.image_url}
          alt="Story"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <Play className="h-4 w-4 text-white fill-white" />
        </div>
      </div>

      {/* Story info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn(
            'text-xs font-semibold',
            isOwn ? 'text-primary-foreground/90' : 'text-foreground'
          )}>
            📷 Respuesta a historia
          </span>
        </div>
        {story.caption && (
          <p className={cn(
            'text-[11px] truncate',
            isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'
          )}>
            {story.caption}
          </p>
        )}
        {story.tenant && (
          <p className={cn(
            'text-[10px]',
            isOwn ? 'text-primary-foreground/50' : 'text-muted-foreground/70'
          )}>
            {story.tenant.name}
          </p>
        )}
      </div>
    </div>
  );
}
