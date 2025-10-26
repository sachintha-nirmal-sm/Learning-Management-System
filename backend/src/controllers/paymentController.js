const stripeSecretKey = (process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRETE_KEY || '').trim();
const stripe = stripeSecretKey ? require('stripe')(stripeSecretKey) : null;
const Course = require('../models/course');
const Enrollment = require('../models/enrollment');
const Payment = require('../models/payment');
const User = require('../models/User');

const getClientOrigin = (req) => req.body.origin || req.headers.origin || process.env.CLIENT_URL || 'http://localhost:3000';

const buildSuccessUrl = (req) => {
  if (req.body.successUrl) {
    return req.body.successUrl;
  }
  const origin = getClientOrigin(req);
  const successPath = req.body.successPath || '/payment-success';
  return `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`;
};

const buildCancelUrl = (req, course) => {
  if (req.body.cancelUrl) {
    return req.body.cancelUrl;
  }
  const origin = getClientOrigin(req);
  const cancelPath = req.body.cancelPath || `/courses/${course?._id || ''}`;
  return `${origin}${cancelPath}`;
};

exports.createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({
        message: 'Stripe is not configured. Please verify STRIPE_SECRET_KEY on the server.'
      });
    }

    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const allowedStatuses = ['published', 'approved'];
    if (course.status && !allowedStatuses.includes(course.status)) {
      return res.status(400).json({ message: 'Course is not available for enrollment' });
    }

    if (course.price === 0) {
      return res.status(400).json({ message: 'Course is free. Use direct enrollment.' });
    }

    const alreadyEnrolled = await Enrollment.findOne({ student: req.user._id, course: courseId });
    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: course.title,
              description: course.description?.slice(0, 200)
            },
            unit_amount: Math.round(course.price * 100)
          },
          quantity: 1
        }
      ],
      metadata: {
        courseId: course._id.toString(),
        studentId: req.user._id.toString()
      },
      success_url: buildSuccessUrl(req),
      cancel_url: buildCancelUrl(req, course),
    });

    await Payment.create({
      student: req.user._id,
      course: course._id,
      amount: course.price,
      currency: 'usd',
      stripeSessionId: session.id,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ message: error.message || 'Failed to create payment session.' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Stripe is not configured' });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const paymentRecord = await Payment.findOne({ stripeSessionId: sessionId });

    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    if (paymentRecord.status === 'paid') {
      return res.status(200).json({ success: true, message: 'Payment already confirmed' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Payment not completed' });
    }

    const courseId = session.metadata?.courseId;
    const studentId = session.metadata?.studentId;

    if (!courseId || !studentId) {
      return res.status(400).json({ message: 'Missing metadata on session' });
    }

    let enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      enrollment = await Enrollment.create({
        student: studentId,
        course: courseId,
        payment: {
          amount: paymentRecord.amount,
          status: 'completed',
          paidAt: new Date()
        }
      });

      await Course.findByIdAndUpdate(courseId, {
        $addToSet: { enrolledStudents: studentId }
      });
      await User.findByIdAndUpdate(studentId, {
        $addToSet: { enrolledCourses: courseId }
      });
    }

    paymentRecord.status = 'paid';
    paymentRecord.stripePaymentIntentId = session.payment_intent?.id || null;
    paymentRecord.receiptUrl = session.payment_intent?.charges?.data?.[0]?.receipt_url;
    await paymentRecord.save();

    res.status(200).json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('Stripe confirm error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const totalRevenueAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = totalRevenueAgg[0]?.totalRevenue || 0;
    const totalPayments = totalRevenueAgg[0]?.count || 0;

    const latestPayments = await Payment.find({ status: 'paid' })
      .populate('student', 'name email')
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalPayments
      },
      latestPayments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
