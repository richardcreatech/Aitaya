import { useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faBolt,
  faPlay,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";

import API_URL from "../../api/my_api_url";

const getYouTubeVideoId = (url) => {
  try {
    const parsedUrl = new URL(url);

    const hostname = parsedUrl.hostname.replace("www.", "");

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.split("/").filter(Boolean)[0];
    }

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      return parsedUrl.searchParams.get("v");
    }

    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    return ["embed", "shorts", "live"].includes(pathParts[0])
      ? pathParts[1]
      : null;
  } catch {
    return null;
  }
};

const getYouTubeEmbedUrl = (url) => {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) return null;

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&enablejsapi=1&origin=${encodeURIComponent(
    window.location.origin,
  )}`;
};

function For_You() {
  const [posts, setPosts] = useState([]);

  const [playingVideos, setPlayingVideos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [likedBurstId, setLikedBurstId] = useState(null);

  const videoRefs = useRef({});
  const lastTapRef = useRef({});
  const burstTimeoutRef = useRef({});

  useEffect(() => {
    async function getPosts() {
      try {
        const response = await fetch(`${API_URL}/api/posts`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Unable to load posts.");

          return;
        }

        setPosts(data.posts);
      } catch (error) {
        console.error("Get posts error:", error);

        setError("Unable to load posts.");
      } finally {
        setLoading(false);
      }
    }

    getPosts();
  }, []);

  const [likingPosts, setLikingPosts] = useState([]);

  const toggleLike = async (postId) => {
    const post = posts.find((item) => item.id === postId);

    if (!post || likingPosts.includes(postId)) return;

    const method = post.isLiked ? "DELETE" : "POST";

    setLikingPosts((current) => [...current, postId]);

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update like");
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) =>
          item.id === postId
            ? {
                ...item,
                isLiked: data.isLiked,
                likesCount: data.likesCount,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Like post error:", error);
    } finally {
      setLikingPosts((current) => current.filter((id) => id !== postId));
    }
  };

  const toggleVideo = async (postId) => {
    const video = videoRefs.current[postId];

    if (!video) return;

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const rewindVideo = (postId) => {
    const video = videoRefs.current[postId];

    if (!video) return;

    video.currentTime = Math.max(0, video.currentTime - 10);

    video.play().catch(() => undefined);
  };

  const updateVideoPlayback = (postId, isPlaying) => {
    setPlayingVideos((current) =>
      isPlaying
        ? [...new Set([...current, postId])]
        : current.filter((id) => id !== postId),
    );
  };

  const triggerLikeBurst = (postId) => {
    setLikedBurstId(postId);

    if (burstTimeoutRef.current[postId]) {
      window.clearTimeout(burstTimeoutRef.current[postId]);
    }

    burstTimeoutRef.current[postId] = window.setTimeout(() => {
      setLikedBurstId((current) => (current === postId ? null : current));
    }, 480);
  };

  const handleMediaLike = (postId, event) => {
    const post = posts.find((item) => item.id === postId);

    if (!post || likingPosts.includes(postId)) return;

    if (event) {
      const target = event.target;
      const isInteractiveTarget =
        target instanceof Element &&
        target.closest(
          "button, a, input, textarea, select, label, iframe, [role='button']",
        );

      if (isInteractiveTarget) return;
    }

    if (post.isLiked) {
      triggerLikeBurst(postId);
      return;
    }

    toggleLike(postId);
    triggerLikeBurst(postId);
  };

  const handleMediaDoubleTap = (postId, event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }

    handleMediaLike(postId, event);
  };

  const handleMediaTouch = (postId, event) => {
    const now = Date.now();
    const previousTap = lastTapRef.current[postId] ?? 0;

    lastTapRef.current[postId] = now;

    if (now - previousTap < 280) {
      handleMediaDoubleTap(postId, event);
    }
  };

  if (loading) {
    return (
      <section id="for_you">
        <p>Loading posts...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section id="for_you">
        <p>{error}</p>
      </section>
    );
  }

  return (
    <section id="for_you" aria-label="Discover posts">
      {posts.map((post) => {
        // const liked = likedPosts.includes(post.id);
        const liked = post.isLiked;
        const youtubeEmbedUrl = getYouTubeEmbedUrl(post.mediaUrl);

        return (
          <article className="discover_post" key={post.id}>
            <div
              className="media"
              onDoubleClick={(event) => handleMediaDoubleTap(post.id, event)}
              onTouchEnd={(event) => handleMediaTouch(post.id, event)}
            >
              {likedBurstId === post.id && (
                <div className="media_like_burst" aria-hidden="true">
                  <span className="lightning_bolt">⚡</span>
                </div>
              )}

              {post.mediaType === "video" ? (
                <div className="video_media">
                  {youtubeEmbedUrl ? (
                    <iframe
                      className="media_content youtube_video"
                      src={youtubeEmbedUrl}
                      title={`${post.username}'s video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      referrerPolicy="strict-origin-when-cross-origin"
                      onLoad={() => updateVideoPlayback(post.id, true)}
                    />
                  ) : (
                    <video
                      ref={(element) => {
                        if (element) {
                          videoRefs.current[post.id] = element;
                        } else {
                          delete videoRefs.current[post.id];
                        }
                      }}
                      className="media_content"
                      src={post.mediaUrl}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      autoPlay
                      aria-label={`${post.username}'s post video`}
                      onClick={(event) => {
                        if (event.detail === 2) return;

                        toggleVideo(post.id);
                      }}
                      onPlay={() => updateVideoPlayback(post.id, true)}
                      onPause={() => updateVideoPlayback(post.id, false)}
                      onEnded={() => updateVideoPlayback(post.id, false)}
                    />
                  )}

                  {!playingVideos.includes(post.id) && (
                    <button
                      className="video_play_button"
                      type="button"
                      aria-label={`Play ${post.username}'s video`}
                      onClick={(event) => {
                        event.stopPropagation();

                        toggleVideo(post.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                  )}

                  {!youtubeEmbedUrl && (
                    <button
                      className="video_rewind_button"
                      type="button"
                      aria-label="Rewind video by 10 seconds"
                      onClick={(event) => {
                        event.stopPropagation();

                        rewindVideo(post.id);
                      }}
                    >
                      <FontAwesomeIcon icon={faRotateLeft} />

                      <span>10s</span>
                    </button>
                  )}
                </div>
              ) : (
                <img
                  className="media_content"
                  src={post.mediaUrl}
                  alt={post.title}
                />
              )}

              <div className="post_overlay">
                <div className="post_details">
                  <img
                    className="post_profile_image"
                    src={post.profile}
                    alt=""
                  />

                  <div className="post_copy">
                    <p className="post_handle">{post.username}</p>

                    <h2>{post.title}</h2>

                    {post.subtitle && (
                      <p className="post_subtitle">{post.subtitle}</p>
                    )}
                  </div>
                </div>

                <button
                  className={`like_button${post.isLiked ? " liked" : ""}`}
                  type="button"
                  aria-label={
                    post.isLiked
                      ? `Unlike ${post.username}'s post`
                      : `Like ${post.username}'s post`
                  }
                  aria-pressed={Boolean(post.isLiked)}
                  disabled={likingPosts.includes(post.id)}
                  onClick={() => toggleLike(post.id)}
                >
                  <FontAwesomeIcon icon={faBolt} />
                  <span>{post.likesCount ?? 0}</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export default For_You;
