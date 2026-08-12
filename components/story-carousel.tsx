"use client";
import { useEffect, useMemo, useState } from "react";
import { PostCard } from "@/components/post-card";
import type { PublicPostCard } from "@/src/public-blog";

export function StoryCarousel({ stories, rotationSeconds }: { stories: PublicPostCard[]; rotationSeconds: number }) {
  const groups = useMemo(() => Array.from({ length: Math.ceil(stories.length / 3) }, (_, index) => stories.slice(index * 3, index * 3 + 3)), [stories]);
  const [active, setActive] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused || groups.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const timer = window.setInterval(() => setActive((value) => (value + 1) % groups.length), rotationSeconds * 1000); return () => window.clearInterval(timer); }, [groups.length, paused, rotationSeconds]);
  if (!stories.length) return <div className="public-empty"><p>No eligible published stories are available.</p></div>;
  return <div className="story-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}><div className="post-grid" aria-live="polite">{groups[active].map((story) => <PostCard key={story.id} post={story} />)}</div>{groups.length > 1 ? <div className="carousel-controls"><button type="button" onClick={() => setActive((active - 1 + groups.length) % groups.length)}>Previous stories</button><span>Group {active + 1} of {groups.length}</span><button type="button" onClick={() => setActive((active + 1) % groups.length)}>Next stories</button></div> : null}<noscript><div className="post-grid">{stories.slice(3).map((story) => <PostCard key={story.id} post={story} />)}</div></noscript></div>;
}
