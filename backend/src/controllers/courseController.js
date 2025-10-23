const Course = require('../models/course');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

const normalizeResources = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((item) => ({
      title: item?.title ? String(item.title).trim() : 'Resource',
      url: item?.url,
      publicId: item?.publicId || item?.public_id
    }))
    .filter((item) => Boolean(item.url));
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      thumbnail,
      requirements,
      whatYouWillLearn,
      language
    } = req.body;

    const normalizeList = (input) => {
      if (Array.isArray(input)) {
        return input.map((item) => String(item).trim()).filter(Boolean);
      }
      return [];
    };

    const course = await Course.create({
      title,
      description,
      category,
      level,
      price: typeof price === 'number' ? price : Number(price) || 0,
      thumbnail: thumbnail && typeof thumbnail === 'object' ? {
        public_id: thumbnail.public_id,
        url: thumbnail.url
      } : undefined,
      requirements: normalizeList(requirements),
      whatYouWillLearn: normalizeList(whatYouWillLearn),
      language: language || 'English',
      instructor: req.user._id
    });

    // Add course to instructor's created courses
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdCourses: course._id }
    });

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all courses with filtering, sorting, and pagination
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res) => {
  try {
    const { category, level, search, sort, page = 1, limit = 10 } = req.query;

    // Build query
    let query = { status: 'published' };

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sortQuery = {};
    if (sort === 'price-asc') {
      sortQuery.price = 1;
    } else if (sort === 'price-desc') {
      sortQuery.price = -1;
    } else if (sort === 'rating') {
      sortQuery['ratings.average'] = -1;
    } else {
      sortQuery.createdAt = -1; // Default: newest first
    }

    // Pagination
    const skip = (page - 1) * limit;
    const total = await Course.countDocuments(query);

    const courses = await Course.find(query)
      .populate('instructor', 'name email avatar')
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email avatar')
      .populate('reviews.user', 'name avatar');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.lectures?.length) {
      course.lectures.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin)
exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();

    // Remove course from instructor's created courses
    await User.findByIdAndUpdate(course.instructor, {
      $pull: { createdCourses: course._id }
    });

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor/my-courses
// @access  Private (Instructor)
exports.getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add lecture to course
// @route   POST /api/courses/:id/lectures
// @access  Private (Instructor/Admin)
exports.addLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lecturePayload = {
      title: req.body.title,
      description: req.body.description,
      videoUrl: req.body.videoUrl,
      videoPublicId: req.body.videoPublicId,
      duration: req.body.duration ? Number(req.body.duration) : undefined,
      resources: normalizeResources(req.body.resources),
      isPreview: Boolean(req.body.isPreview),
      order: course.lectures.length + 1
    };

    course.lectures.push(lecturePayload);
    await course.save();

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update lecture
// @route   PUT /api/courses/:courseId/lectures/:lectureId
// @access  Private (Instructor/Admin)
exports.updateLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lecture = course.lectures.id(req.params.lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    const previousVideoPublicId = lecture.videoPublicId;

    if (req.body.title !== undefined) {
      lecture.title = req.body.title;
    }
    if (req.body.description !== undefined) {
      lecture.description = req.body.description;
    }
    if (req.body.videoUrl !== undefined) {
      lecture.videoUrl = req.body.videoUrl;
    }
    if (req.body.videoPublicId !== undefined) {
      lecture.videoPublicId = req.body.videoPublicId;
    }
    if (req.body.duration !== undefined) {
      lecture.duration = req.body.duration ? Number(req.body.duration) : undefined;
    }
    if (req.body.resources !== undefined) {
      lecture.resources = normalizeResources(req.body.resources);
    }
    if (req.body.isPreview !== undefined) {
      lecture.isPreview = Boolean(req.body.isPreview);
    }

    await course.save();

    if (previousVideoPublicId && previousVideoPublicId !== lecture.videoPublicId) {
      try {
        await cloudinary.uploader.destroy(previousVideoPublicId, { resource_type: 'video' });
      } catch (cleanupError) {
        console.error('Failed to delete old lecture video:', cleanupError.message);
      }
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete lecture
// @route   DELETE /api/courses/:courseId/lectures/:lectureId
// @access  Private (Instructor/Admin)
exports.deleteLecture = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lecture = course.lectures.id(req.params.lectureId);
    if (lecture?.videoPublicId) {
      try {
        await cloudinary.uploader.destroy(lecture.videoPublicId, { resource_type: 'video' });
      } catch (cleanupError) {
        console.error('Failed to delete lecture video:', cleanupError.message);
      }
    }

    if (Array.isArray(lecture?.resources) && lecture.resources.length) {
      for (const resource of lecture.resources) {
        if (!resource?.publicId) continue;
        try {
          await cloudinary.uploader.destroy(resource.publicId, { resource_type: 'raw' });
        } catch (cleanupError) {
          console.error('Failed to delete lecture resource:', cleanupError.message);
        }
      }
    }

    course.lectures.pull(req.params.lectureId);

    course.lectures.forEach((item, index) => {
      item.order = index + 1;
    });

    await course.save();

    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully',
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reorder lectures
// @route   PUT /api/courses/:courseId/lectures/reorder
// @access  Private (Instructor/Admin)
exports.reorderLectures = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { order } = req.body;

    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ message: 'Invalid lecture order payload' });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lectureIdSet = new Set(order.map(String));
    const existingLectures = course.lectures;

    if (existingLectures.length !== lectureIdSet.size) {
      return res.status(400).json({ message: 'Lecture order does not match existing lectures' });
    }

    const allIdsValid = existingLectures.every((lecture) => lectureIdSet.has(String(lecture._id)));
    if (!allIdsValid) {
      return res.status(400).json({ message: 'Lecture order contains invalid entries' });
    }

    order.forEach((lectureId, index) => {
      const lecture = existingLectures.id(lectureId);
      if (lecture) {
        lecture.order = index + 1;
      }
    });

    await course.save();

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add review to course
// @route   POST /api/courses/:id/reviews
// @access  Private (Student)
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is enrolled in the course
    if (!course.enrolledStudents.includes(req.user._id)) {
      return res.status(403).json({ message: 'You must be enrolled to review this course' });
    }

    // Check if user already reviewed
    const existingReview = course.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this course' });
    }

    course.reviews.push({
      user: req.user._id,
      rating,
      comment
    });

    // Update ratings
    course.updateRatings();
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Publish course
// @route   PUT /api/courses/:id/publish
// @access  Private (Instructor/Admin)
exports.publishCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check authorization
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    course.status = 'published';
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course published successfully',
      course
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
