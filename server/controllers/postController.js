import pool from "../config/db.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../config/s3.js";

export async function createPost(req, res) {
  const userId = req.user.id;

  const { caption, subcaption } = req.body;

  try {
    // Make sure a file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "A photo or video is required",
      });
    }

    // Upload media to S3
    const mediaKey = await uploadToS3(req.file, `posts/${userId}`);

    // Determine whether the uploaded file is an image or video
    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

    // Create the post
    const result = await pool.query(
      `INSERT INTO posts (
        user_id,
        caption,
        subcaption,
        media_key,
        media_type
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [userId, caption || null, subcaption || null, mediaKey, mediaType],
    );

    return res.status(201).json({
      message: "Post created successfully",
      post: result.rows[0],
    });
  } catch (error) {
    console.error("Create post error:", error);

    return res.status(500).json({
      message: "Something went wrong while creating the post",
    });
  }
}

export async function getPosts(req, res) {
  try {
    const result = await pool.query(
      `SELECT
        posts.id,
        posts.caption,
        posts.subcaption,
        posts.media_key,
        posts.media_type,
        posts.likes_count,
        posts.created_at,

        profiles.username,
        profiles.profile_picture

       FROM posts

       JOIN profiles
         ON profiles.user_id = posts.user_id

       ORDER BY posts.created_at DESC`,
    );

    const posts = result.rows.map((post) => ({
      id: post.id,

      username: `@${post.username}`,

      profile: post.profile_picture,

      title: post.caption,

      subtitle: post.subcaption,

      mediaType: post.media_type,

      mediaUrl: post.media_key,

      likesCount: post.likes_count,
    }));

    return res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);

    return res.status(500).json({
      message: "Something went wrong while getting posts",
    });
  }
}

export async function getUserPosts(req, res) {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        posts.id,
        posts.caption,
        posts.subcaption,
        posts.media_key,
        posts.media_type,
        posts.likes_count,
        posts.created_at,

        profiles.username,
        profiles.profile_picture

       FROM posts

       JOIN profiles
         ON profiles.user_id = posts.user_id

       WHERE posts.user_id = $1

       ORDER BY posts.created_at DESC`,
      [userId],
    );

    const posts = result.rows.map((post) => ({
      id: post.id,

      username: `@${post.username}`,

      profile: post.profile_picture,

      title: post.caption,

      subtitle: post.subcaption,

      mediaType: post.media_type,

      mediaUrl: post.media_key,

      likesCount: post.likes_count,

      createdAt: post.created_at,
    }));

    return res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("Get user posts error:", error);

    return res.status(500).json({
      message: "Something went wrong while getting user posts",
    });
  }
}

export async function getPost(req, res) {
  const { postId } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        posts.id,
        posts.caption,
        posts.subcaption,
        posts.media_key,
        posts.media_type,
        posts.likes_count,
        posts.created_at,

        users.id AS creator_id,
        profiles.username AS creator_username,
        profiles.name AS creator_name,
        profiles.profile_picture AS creator_profile_picture

       FROM posts

       JOIN users
         ON users.id = posts.user_id

       JOIN profiles
         ON profiles.user_id = users.id

       WHERE posts.id = $1`,
      [postId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const post = result.rows[0];

    return res.status(200).json({
      post: {
        id: post.id,

        caption: post.caption,

        subcaption: post.subcaption,

        mediaKey: post.media_key,

        mediaType: post.media_type,

        likesCount: post.likes_count,

        createdAt: post.created_at,

        creator: {
          id: post.creator_id,

          username: `@${post.creator_username}`,

          name: post.creator_name,

          profilePicture: post.creator_profile_picture,
        },
      },
    });
  } catch (error) {
    console.error("Get post error:", error);

    return res.status(500).json({
      message: "Something went wrong while getting the post",
    });
  }
}

export async function deletePost(req, res) {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // Find the post and confirm that the logged-in user owns it.
    const result = await pool.query(
      `SELECT id, user_id, media_key
       FROM posts
       WHERE id = $1`,
      [postId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const post = result.rows[0];

    if (String(post.user_id) !== String(userId)) {
      return res.status(403).json({
        message: "You cannot delete someone else's post",
      });
    }

    // Delete the post from PostgreSQL.
    await pool.query(
      `DELETE FROM posts
       WHERE id = $1 AND user_id = $2`,
      [postId, userId],
    );

    // Delete the associated media from S3.
    if (post.media_key) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: post.media_key,
        }),
      );
    }

    return res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return res.status(500).json({
      message: "Something went wrong while deleting the post",
    });
  }
}

export async function likePost(req, res) {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Check that the post exists
    const post = await pool.query(
      "SELECT id FROM posts WHERE id = $1",
      [postId]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // 2. Add the like, unless this user already liked the post
    const result = await pool.query(
      `INSERT INTO post_likes (post_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (post_id, user_id) DO NOTHING
       RETURNING id`,
      [postId, userId]
    );

    // 3. Increase likes_count only if a new like was inserted
    if (result.rows.length > 0) {
      await pool.query(
        `UPDATE posts
         SET likes_count = likes_count + 1
         WHERE id = $1`,
        [postId]
      );
    }

    // 4. Get the latest count
    const updatedPost = await pool.query(
      "SELECT likes_count FROM posts WHERE id = $1",
      [postId]
    );

    return res.status(200).json({
      message: "Post liked successfully",
      isLiked: true,
      likesCount: updatedPost.rows[0].likes_count,
    });
  } catch (error) {
    console.error("Like post error:", error);

    return res.status(500).json({
      message: "Something went wrong while liking the post",
    });
  }
}

export async function unlikePost(req, res) {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Check that the post exists
    const post = await pool.query(
      "SELECT id FROM posts WHERE id = $1",
      [postId]
    );

    if (post.rows.length === 0) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    // 2. Remove this user's like from the post
    const result = await pool.query(
      `DELETE FROM post_likes
       WHERE post_id = $1 AND user_id = $2
       RETURNING id`,
      [postId, userId]
    );

    // 3. Decrease the count only if a like was actually removed
    if (result.rows.length > 0) {
      await pool.query(
        `UPDATE posts
         SET likes_count = GREATEST(likes_count - 1, 0)
         WHERE id = $1`,
        [postId]
      );
    }

    // 4. Get the updated like count
    const updatedPost = await pool.query(
      "SELECT likes_count FROM posts WHERE id = $1",
      [postId]
    );

    return res.status(200).json({
      message: "Post unliked successfully",
      isLiked: false,
      likesCount: updatedPost.rows[0].likes_count,
    });
  } catch (error) {
    console.error("Unlike post error:", error);

    return res.status(500).json({
      message: "Something went wrong while unliking the post",
    });
  }
}
