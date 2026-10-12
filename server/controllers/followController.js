import pool from "../config/db.js";
import { uploadToS3 } from "../utils/uploadToS3.js";

export async function getFollowing(req, res) {
  const currentUserId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
        users.id,
        profiles.username,
        profiles.name,
        profiles.bio,
        profiles.profile_picture,
        follows.created_at AS followed_at
       FROM follows
       JOIN users
         ON users.id = follows.following_id
       JOIN profiles
         ON profiles.user_id = users.id
       WHERE follows.follower_id = $1
       ORDER BY follows.created_at DESC`,
      [currentUserId]
    );

    return res.status(200).json({
      users: result.rows.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profilePicture: user.profile_picture,
        followedAt: user.followed_at,
        isFollowing: true,
      })),
    });
  } catch (error) {
    console.error("Get following error:", error);

    return res.status(500).json({
      message: "Unable to load the people you follow",
    });
  }
}

export async function getRecommendedUsers(req, res) {
  const currentUserId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
        users.id,
        profiles.username,
        profiles.name,
        profiles.bio,
        profiles.profile_picture
       FROM users
       JOIN profiles
         ON profiles.user_id = users.id
       WHERE users.id <> $1
         AND NOT EXISTS (
           SELECT 1
           FROM follows
           WHERE follows.follower_id = $1
             AND follows.following_id = users.id
         )
       ORDER BY users.created_at DESC
       LIMIT 20`,
      [currentUserId]
    );

    return res.status(200).json({
      users: result.rows.map((user) => ({
        id: user.id,
        username: user.username,
        name: user.name,
        bio: user.bio,
        profilePicture: user.profile_picture,
        isFollowing: false,
      })),
    });
  } catch (error) {
    console.error("Get recommended users error:", error);

    return res.status(500).json({
      message: "Unable to load recommended users",
    });
  }
}

export async function searchUsers(req, res) {
  const currentUserId = req.user.id;

  const searchTerm =
    typeof req.query.q === "string"
      ? req.query.q.trim().replace(/^@/, "")
      : "";

  if (searchTerm.length > 80) {
    return res.status(400).json({
      message: "Search term is too long",
    });
  }

  try {
    let result;

    if (!searchTerm) {
      // No search term: recommend random users
      const query = `
        SELECT
          users.id,
          profiles.username,
          profiles.name,
          profiles.bio,
          profiles.profile_picture,
          false AS is_following
        FROM users
        JOIN profiles
          ON profiles.user_id = users.id
        WHERE users.id <> $1
          AND NOT EXISTS (
            SELECT 1
            FROM follows
            WHERE follows.follower_id = $1
              AND follows.following_id = users.id
          )
        ORDER BY RANDOM()
        LIMIT 20
      `;

      result = await pool.query(query, [currentUserId]);
    } else {
      // Search term provided: find matching users
      const searchPattern = `%${searchTerm}%`;
      const startsWithPattern = `${searchTerm}%`;

      const query = `
        SELECT
          users.id,
          profiles.username,
          profiles.name,
          profiles.bio,
          profiles.profile_picture,
          EXISTS (
            SELECT 1
            FROM follows
            WHERE follows.follower_id = $1
              AND follows.following_id = users.id
          ) AS is_following
        FROM users
        JOIN profiles
          ON profiles.user_id = users.id
        WHERE users.id <> $1
          AND (
            profiles.username ILIKE $2
            OR profiles.name ILIKE $2
            OR profiles.bio ILIKE $2
          )
        ORDER BY
          CASE
            WHEN profiles.username ILIKE $3 THEN 0
            WHEN profiles.name ILIKE $3 THEN 1
            ELSE 2
          END,
          profiles.name ASC
        LIMIT 20
      `;

      result = await pool.query(query, [
        currentUserId,
        searchPattern,
        startsWithPattern,
      ]);
    }

    const users = result.rows.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      profilePicture: user.profile_picture,
      isFollowing: user.is_following,
    }));

    return res.status(200).json({
      users,
      count: users.length,
    });
  } catch (error) {
    console.error("Search users error:", error);

    return res.status(500).json({
      message: "Unable to load users",
    });
  }
}


export async function getFollowingPosts(req, res) {
  const currentUserId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
        posts.id,
        posts.user_id,
        posts.caption,
        posts.subcaption,
        posts.media_key,
        posts.media_type,
        posts.likes_count,
        posts.created_at,
        profiles.username,
        profiles.profile_picture,

        EXISTS (
          SELECT 1
          FROM post_likes
          WHERE post_likes.post_id = posts.id
            AND post_likes.user_id = $1
        ) AS is_liked

       FROM posts

       JOIN follows
         ON follows.following_id = posts.user_id
        AND follows.follower_id = $1

       JOIN profiles
         ON profiles.user_id = posts.user_id

       ORDER BY posts.created_at DESC
       LIMIT 50`,
      [currentUserId]
    );

    const posts = result.rows.map((post) => ({
      id: post.id,
      userId: post.user_id,
      username: `@${post.username}`,
      profile: post.profile_picture,
      title: post.caption,
      subtitle: post.subcaption,
      mediaType: post.media_type,
      mediaUrl: post.media_key,
      likesCount: post.likes_count,
      isLiked: post.is_liked,
      createdAt: post.created_at,
    }));

    return res.status(200).json({ posts });
  } catch (error) {
    console.error("Get following posts error:", error);

    return res.status(500).json({
      message: "Unable to load posts from people you follow",
    });
  }
}

export async function followUser(req, res) {
  const currentUserId = req.user.id;
  const targetUserId = req.params.userId;

  try {
    // 1. Validate the target user's ID
    if (!/^\d+$/.test(targetUserId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    // 2. Prevent users from following themselves
    if (String(currentUserId) === targetUserId) {
      return res.status(400).json({
        message: "You cannot follow yourself",
      });
    }

    // 3. Check that the target user exists
    const user = await pool.query(
      "SELECT id FROM users WHERE id = $1",
      [targetUserId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 4. Create the follow relationship
    const result = await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id)
       DO NOTHING
       RETURNING id`,
      [currentUserId, targetUserId]
    );

    // 5. Get the target user's follower count
    const count = await pool.query(
      `SELECT COUNT(*)::int AS followers_count
       FROM follows
       WHERE following_id = $1`,
      [targetUserId]
    );

    return res.status(200).json({
      message: result.rows.length > 0
        ? "User followed successfully"
        : "You are already following this user",
      isFollowing: true,
      followersCount: count.rows[0].followers_count,
    });
  } catch (error) {
    console.error("Follow user error:", error);

    return res.status(500).json({
      message: "Unable to follow user",
    });
  }
}
