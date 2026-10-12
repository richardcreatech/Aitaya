import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import API_URL from "../../api/my_api_url";

import EditProfile from "../../components/EditProfile";
import View_Post from "./View_Post";

function Profile() {
  const [user, setUser] = useState(null);

  const [posts, setPosts] = useState([]);

  const [isEditing, setIsEditing] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState(null);

  const [deletePostId, setDeletePostId] = useState(null);

  const [deleteError, setDeleteError] = useState("");

  const [isDeleting, setIsDeleting] = useState(false);

  const [refreshVersion, setRefreshVersion] = useState(0);

  const [postsLoading, setPostsLoading] = useState(true);

  async function handleDeletePost() {
    if (!deletePostId) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch(`${API_URL}/api/posts/${deletePostId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.message || "Could not delete post.");
        return;
      }

      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== deletePostId),
      );
      setDeletePostId(null);
    } catch (error) {
      console.error("Delete post error:", error);
      setDeleteError("Unable to delete post. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  const hardcodedData = {
    followers: 128,
    following: 64,
  };

  useEffect(() => {
    async function getUser() {
      try {
        const response = await fetch(`${API_URL}/api/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data.message);
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Error getting profile:", error);
      }
    }

    getUser();
  }, [refreshVersion]);

  useEffect(() => {
    async function getUserPosts() {
      if (!user) return;

      try {
        const response = await fetch(`${API_URL}/api/posts/user/${user.id}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(data.message);
          return;
        }

        setPosts(data.posts);
      } catch (error) {
        console.error("Error getting user posts:", error);
      } finally {
        setPostsLoading(false);
      }
    }

    getUserPosts();
  }, [user]);

  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <section id="profile_pg">
      <header className="profile_header">
        <img
          src={user.profile_picture}
          alt={`${user.name}'s profile`}
          className="profile_image"
        />

        <div className="profile_details">
          <div className="profile_name">
            <h1>{user.name}</h1>

            <p>@{user.username}</p>
          </div>

          <p className="profile_bio">{user.bio || "No bio yet."}</p>

          <div className="profile_stats">
            <span>
              <strong>{posts.length}</strong> posts
            </span>

            <span>
              <strong>{hardcodedData.followers}</strong> followers
            </span>

            <span>
              <strong>{hardcodedData.following}</strong> following
            </span>
          </div>

          <button
            type="button"
            className="edit_profile"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        </div>
      </header>

      <div className="profile_posts">
        {postsLoading ? (
          <p>Loading posts...</p>
        ) : posts.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="profile_post">
              <button
                type="button"
                className="profile_post_open"
                aria-label={`Open post by ${user.name}`}
                onClick={() => setSelectedPostId(post.id)}
              >
                {post.mediaType === "video" ? (
                  <video
                    src={post.mediaUrl}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="profile_post_media"
                  />
                ) : (
                  <img
                    src={post.mediaUrl}
                    alt={post.title || "Post"}
                    className="profile_post_media"
                  />
                )}
              </button>
              <button
                type="button"
                className="profile_post_delete"
                aria-label="Delete post"
                title="Delete post"
                onClick={() => {
                  setDeleteError("");
                  setDeletePostId(post.id);
                }}
              >
                <span className="profile_delete_bin" aria-hidden="true">
                  <FontAwesomeIcon icon={faTrashCan} />
                </span>
              </button>
            </article>
          ))
        )}
      </div>

      {isEditing && (
        <EditProfile
          user={user}
          onClose={() => setIsEditing(false)}
          onUpdated={() => setRefreshVersion((version) => version + 1)}
        />
      )}

      {selectedPostId && (
        <View_Post
          postId={selectedPostId}
          onClose={() => setSelectedPostId(null)}
        />
      )}

      {deletePostId && (
        <div
          className="delete_post_overlay"
          onClick={() => !isDeleting && setDeletePostId(null)}
        >
          <section
            className="delete_post_dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete_post_title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete_post_illustration" aria-hidden="true">
              <FontAwesomeIcon icon={faTrashCan} />
            </div>
            <h2 id="delete_post_title">Toss this post?</h2>
            <p>This post will be permanently removed from your profile.</p>
            {deleteError && (
              <p className="delete_post_error" role="alert">
                {deleteError}
              </p>
            )}
            <div className="delete_post_actions">
              <button
                type="button"
                className="delete_post_cancel"
                disabled={isDeleting}
                onClick={() => setDeletePostId(null)}
              >
                Keep post
              </button>
              <button
                type="button"
                className="delete_post_confirm"
                disabled={isDeleting}
                onClick={handleDeletePost}
              >
                {isDeleting ? "Deleting..." : "Delete post"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default Profile;
