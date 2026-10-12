import { useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import API_URL from "../../api/my_api_url";

function View_Post({ postId: propPostId, onClose }) {
  const routeParams = useParams();
  const postId = propPostId || routeParams.postId;

  const [post, setPost] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function getPost() {
      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || "Unable to load post.");

          return;
        }

        setPost(data.post);
      } catch (error) {
        console.error("Get post error:", error);

        setError("Unable to load post.");
      } finally {
        setLoading(false);
      }
    }

    getPost();
  }, [postId]);

  const content = (() => {
    if (loading) {
      return (
        <main id="view_post_pg">
          <p>Loading post...</p>
        </main>
      );
    }

    if (error) {
      return (
        <main id="view_post_pg">
          <p>{error}</p>
        </main>
      );
    }

    if (!post) {
      return null;
    }

    return (
      <main id="view_post_pg">
        <section id="my_current_post">
          {post.mediaType === "video" ? (
            <video src={post.mediaKey} controls playsInline />
          ) : (
            <img src={post.mediaKey} alt={post.caption || "Post"} />
          )}
        </section>

        <section id="current_post_info">
          <div className="not_post_comments">
            <div className="post_creator">
              <img
                src={post.creator.profilePicture}
                alt={`${post.creator.name}'s profile`}
              />

              <div>
                <h2>{post.creator.name}</h2>

                <p>{post.creator.username}</p>
              </div>
            </div>

            <div className="post_text">
              <h1>{post.caption}</h1>

              {post.subcaption && <p>{post.subcaption}</p>}
            </div>

            <div className="post_stats">
              <span>{post.likesCount} likes</span>
            </div>
          </div>

          <div className="post_comments">
            <h2>Comments</h2>

            <p>Comments will appear here.</p>
          </div>
        </section>
      </main>
    );
  })();

  if (!onClose) {
    return content;
  }

  return (
    <div
      className="post_detail_overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Post details"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="post_detail_popup">
        <button
          type="button"
          className="close_post_detail"
          aria-label="Close post details"
          onClick={onClose}
        >
          ×
        </button>

        {content}
      </div>
    </div>
  );
}

export default View_Post;
