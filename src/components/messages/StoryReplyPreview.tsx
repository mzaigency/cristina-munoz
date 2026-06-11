import { useState, useEffect } from 'react';
import { Image as ImageIcon, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StoryReplyPreviewProps {
  storyId: string;
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

export function StoryReplyPreview({ storyId }: StoryReplyPreviewProps) {
  const [story, setStory] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('salon_stories')
          .select(
            `id, image_url, caption, tenant:tenants(name, logo_url)`
          )
          .eq('id', storyId)
          .maybeSingle();

        if (cancelled) return;
        if (fetchError) throw fetchError;
        if (data) setStory(data as StoryData);
        else setError(true);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [storyId]);

  if (loading) {
    return (
      <div className="msg-story" aria-busy="true">
        <div className="msg-story-thumb">
          <div className="msg-story-thumb-fb">
            <ImageIcon className="h-5 w-5" />
          </div>
        </div>
        <div className="msg-story-info">
          <p className="msg-story-title">Cargando historia…</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="msg-story">
        <div className="msg-story-thumb">
          <div className="msg-story-thumb-fb">
            <ImageIcon className="h-5 w-5" />
          </div>
        </div>
        <div className="msg-story-info">
          <p className="msg-story-title">Historia no disponible</p>
          <p className="msg-story-caption">Expiró o fue eliminada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="msg-story">
      <div className="msg-story-thumb">
        <img src={story.image_url} alt="Historia" />
        <div className="msg-story-thumb-play">
          <Play className="h-3.5 w-3.5 fill-current" />
        </div>
      </div>
      <div className="msg-story-info">
        <p className="msg-story-title">Respuesta a historia</p>
        {story.caption && <p className="msg-story-caption">{story.caption}</p>}
        {story.tenant && <p className="msg-story-tenant">{story.tenant.name}</p>}
      </div>
    </div>
  );
}
