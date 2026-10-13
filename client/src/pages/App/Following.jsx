import { useCallback, useEffect, useState } from "react";
import API_URL from "../../api/my_api_url";
import ProfileAvatar from "../../components/ProfileAvatar";

function Following() {
  const [following, setFollowing] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [followError, setFollowError] = useState("");
  const [followingInProgress, setFollowingInProgress] = useState(null);

  // Load followed accounts, recommendations, and their posts
  const loadFollowingPage = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      // 1. Get the accounts the current user follows
      const followingResponse = await fetch(`${API_URL}/api/follow/following`, {
        credentials: "include",
      });

      const followingData = await followingResponse.json();

      if (!followingResponse.ok) {
        throw new Error(followingData.message || "Unable to load following");
      }

      const users = followingData.users ?? [];

      // 2. Always get recommendations, even when following people
      const [recommendationsResponse, postsResponse] = await Promise.all([
        fetch(`${API_URL}/api/follow/recommended`, {
          credentials: "include",
        }),

        users.length > 0
          ? fetch(`${API_URL}/api/follow/posts`, {
              credentials: "include",
            })
          : Promise.resolve(null),
      ]);

      const recommendationsData = await recommendationsResponse.json();

      if (!recommendationsResponse.ok) {
        throw new Error(
          recommendationsData.message || "Unable to load recommended users",
        );
      }

      let fetchedPosts = [];

      if (postsResponse) {
        const postsData = await postsResponse.json();

        if (!postsResponse.ok) {
          throw new Error(postsData.message || "Unable to load posts");
        }

        fetchedPosts = postsData.posts ?? [];
      }

      setFollowing(users);
      setRecommendedUsers(recommendationsData.users ?? []);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Following page error:", error);
      setError(error.message || "Unable to load this page.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadFollowingPage(true);
  }, [loadFollowingPage]);

  // Search users after the user pauses typing
  useEffect(() => {
    const query = searchTerm.trim();

    if (!query) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await fetch(
          `${API_URL}/api/follow/search?q=${encodeURIComponent(query)}`,
          { credentials: "include" },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to search users");
        }

        if (!cancelled) {
          // Only suggest people the user does not already follow
          setSearchResults(
            (data.users ?? []).filter((user) => !user.isFollowing),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setSearchError(error.message || "Unable to search users.");
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  // Follow a recommended or searched user
  async function handleFollow(userId) {
    if (followingInProgress !== null) return;

    setFollowingInProgress(userId);
    setFollowError("");

    try {
      const response = await fetch(`${API_URL}/api/follow/${userId}/follow`, {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to follow this user");
      }

      // Clear the search and refresh the actual server data.
      // If this was the first follow, the layout changes automatically.
      setSearchTerm("");
      await loadFollowingPage();
    } catch (error) {
      console.error("Follow user error:", error);
      setFollowError(error.message || "Unable to follow this user.");
    } finally {
      setFollowingInProgress(null);
    }
  }

  const visibleUsers = searchTerm.trim() ? searchResults : recommendedUsers;

  if (loading) {
    return (
      <section id="following_pg">
        <p className="following_status">Loading your people...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section id="following_pg">
        <div className="following_page_error">
          <p role="alert">{error}</p>

          <button type="button" onClick={() => loadFollowingPage(true)}>
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="following_pg">
      {following.length === 0 ? (
        /* ==================================
           LAYOUT 1: NO FOLLOWED ACCOUNTS
        ================================== */
        <div className="following_discovery_empty">
          <div className="following_discovery_box">
            <div className="discovery_intro">
              <span className="following_eyebrow">YOUR WORLD, YOUR PEOPLE</span>

              <h1>Find your people.</h1>

              <p>
                Discover creators, meet new people, and make your Glitch Me feed
                your own.
              </p>
            </div>

            <label className="following_search">
              <span aria-hidden="true">⌕</span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name or username..."
                aria-label="Search people"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="clear_search"
                  aria-label="Clear search"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </button>
              )}
            </label>

            {followError && (
              <p className="following_message_error" role="alert">
                {followError}
              </p>
            )}

            {searchError && (
              <p className="following_message_error" role="alert">
                {searchError}
              </p>
            )}

            <div className="discovery_results_heading">
              <h2>
                {searchTerm.trim() ? "Search results" : "People you might like"}
              </h2>

              {!searchTerm.trim() && (
                <span>{recommendedUsers.length} people</span>
              )}
            </div>

            {searchLoading ? (
              <p className="following_status">Finding people...</p>
            ) : visibleUsers.length > 0 ? (
              <div className="people_grid">
                {visibleUsers.map((user) => (
                  <article className="discovery_person_card" key={user.id}>
                    <ProfileAvatar
                      src={user.profilePicture}
                      name={user.name}
                      className="discovery_card_avatar"
                    />

                    <h3>{user.name}</h3>

                    <p className="discovery_username">@{user.username}</p>

                    {user.bio && <p className="discovery_bio">{user.bio}</p>}

                    <button
                      className="follow_primary_button"
                      type="button"
                      disabled={followingInProgress !== null}
                      onClick={() => handleFollow(user.id)}
                    >
                      {String(followingInProgress) === String(user.id)
                        ? "Following..."
                        : "Follow"}
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="following_empty_message">
                <span aria-hidden="true">{searchTerm.trim() ? "⌕" : "✦"}</span>

                <h3>
                  {searchTerm.trim()
                    ? "No people found"
                    : "No recommendations yet"}
                </h3>

                <p>
                  {searchTerm.trim()
                    ? "Try another name or username."
                    : "New people will appear here as they join Glitch Me."}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ==================================
           LAYOUT 2: FOLLOWING ACCOUNTS
        ================================== */
        <div className="following_populated">
          {(visibleUsers.length > 0 || searchTerm.trim()) && (
            <section className="people_to_follow">
              <div className="people_to_follow_header">
                <div>
                  <span className="following_eyebrow">KEEP DISCOVERING</span>

                  <h2>People to follow</h2>
                </div>

                <label className="following_search compact_search">
                  <span aria-hidden="true">⌕</span>

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Find people..."
                    aria-label="Search people to follow"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      className="clear_search"
                      aria-label="Clear search"
                      onClick={() => setSearchTerm("")}
                    >
                      ×
                    </button>
                  )}
                </label>
              </div>

              {followError && (
                <p className="following_message_error" role="alert">
                  {followError}
                </p>
              )}

              {searchError && (
                <p className="following_message_error" role="alert">
                  {searchError}
                </p>
              )}

              {searchLoading ? (
                <p className="following_status">Finding people...</p>
              ) : visibleUsers.length > 0 ? (
                <div className="people_to_follow_list">
                  {visibleUsers.map((user) => (
                    <article className="discover_person" key={user.id}>
                      <ProfileAvatar
                        src={user.profilePicture}
                        name={user.name}
                        className="discover_person_avatar"
                      />

                      <div className="discover_person_details">
                        <h3>{user.name}</h3>
                        <p>@{user.username}</p>
                      </div>

                      <button
                        type="button"
                        className="follow_plus_button"
                        aria-label={`Follow ${user.username}`}
                        title={`Follow ${user.username}`}
                        disabled={followingInProgress !== null}
                        onClick={() => handleFollow(user.id)}
                      >
                        {String(followingInProgress) === String(user.id)
                          ? "…"
                          : "+"}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="compact_discovery_empty">
                  {searchTerm.trim()
                    ? "No matching people found."
                    : "You're following everyone in these suggestions. Check back later!"}
                </p>
              )}
            </section>
          )}
          <section className="following_posts_section">
            <header className="following_feed_header">
              <div>
                <span className="following_eyebrow">YOUR CIRCLE</span>

                <h1>Following</h1>

                <p>The latest from people you've chosen to follow.</p>
              </div>

              <span className="following_count">
                {following.length}{" "}
                {following.length === 1 ? "person" : "people"}
              </span>
            </header>

            {posts.length > 0 ? (
              <div className="following_posts">
                {posts.map((post) => (
                  <article className="following_post" key={post.id}>
                    <header className="following_post_author">
                      <ProfileAvatar
                        src={post.profile}
                        name={post.username?.replace(/^@/, "")}
                        className="following_post_avatar"
                      />

                      <div>
                        <h3>{post.username}</h3>

                        {post.createdAt && (
                          <time dateTime={post.createdAt}>
                            {new Date(post.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </time>
                        )}
                      </div>
                    </header>

                    <div className="following_post_media">
                      {post.mediaType === "video" ? (
                        <video
                          src={post.mediaUrl}
                          controls
                          playsInline
                          preload="metadata"
                          aria-label={post.title || "Post video"}
                        />
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt={post.title || "Post"}
                          loading="lazy"
                        />
                      )}
                    </div>

                    {(post.title || post.subtitle) && (
                      <div className="following_post_copy">
                        {post.title && (
                          <p className="following_post_caption">{post.title}</p>
                        )}

                        {post.subtitle && (
                          <p className="following_post_subtitle">
                            {post.subtitle}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="following_post_metrics">
                      <span>
                        ♥ {post.likesCount ?? 0}{" "}
                        {(post.likesCount ?? 0) === 1 ? "like" : "likes"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="following_feed_empty">
                <span aria-hidden="true">✧</span>

                <h2>Nothing new just yet.</h2>

                <p>
                  You're following people! Their posts will show up here when
                  they share something.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

export default Following;
