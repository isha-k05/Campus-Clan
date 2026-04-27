const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/authMiddleware');

// POST /api/posts - Create a new post
router.post('/', protect, async (req, res) => {
  try {
    const { content, mediaUrl, mediaType, visibility, poll } = req.body;
    
    if (!content && !mediaUrl && !poll) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      mediaUrl,
      mediaType,
      visibility,
      poll
    });

    const populatedPost = await Post.findById(post._id).populate('author', 'name college profilePicture');

    res.status(201).json({ success: true, post: populatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/posts - Get feed (paginated)
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Post.countDocuments();
    const posts = await Post.find()
      .populate('author', 'name college profilePicture')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ 
      success: true, 
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/posts/user/:userId - Get posts by a specific user
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId })
      .populate('author', 'name college profilePicture')
      .populate('comments.user', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/posts/:id/like - Like/Unlike a post
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.likes.includes(req.user.id)) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      // Like
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/posts/:id/comment - Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.comments.push({
      user: req.user.id,
      content
    });

    await post.save();
    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name college profilePicture')
      .populate('comments.user', 'name profilePicture');

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/posts/:id/vote - Vote on a poll
router.put('/:id/vote', protect, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post || !post.poll) {
      return res.status(404).json({ success: false, message: 'Post or Poll not found' });
    }

    // Check if user already voted on this poll
    let hasVoted = false;
    post.poll.options.forEach(option => {
      if (option.votes.includes(req.user.id)) {
        hasVoted = true;
      }
    });

    if (hasVoted) {
      return res.status(400).json({ success: false, message: 'Already voted' });
    }

    // Add vote
    post.poll.options[optionIndex].votes.push(req.user.id);
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate('author', 'name college profilePicture')
      .populate('comments.user', 'name profilePicture');

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE /api/posts/:id - Delete a post
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
