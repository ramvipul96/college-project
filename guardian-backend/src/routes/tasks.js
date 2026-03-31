const express = require('express');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks
// @desc    Get all tasks for logged-in user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, priority, due } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const task = await Task.create({
      user: req.user._id,
      title,
      priority: priority || 'Medium',
      due: due || 'Today',
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   PATCH /api/tasks/:id
// @desc    Update task (toggle done, change priority, etc.)
// @access  Private
router.patch('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const wasNotDone = !task.done;

    Object.assign(task, req.body);

    // Set completedAt if just marked done
    if (wasNotDone && task.done) {
      task.completedAt = new Date();

      // Create a notification when task is completed
      await Notification.create({
        user: req.user._id,
        type: 'task',
        title: `Task completed: ${task.title}`,
        desc: 'Great job staying on track with your tasks!',
      });
    }

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.status(200).json({ success: true, message: 'Task deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
