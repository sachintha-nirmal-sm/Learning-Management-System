const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
	student: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
		required: true
	},
	course: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Course',
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	currency: {
		type: String,
		default: 'usd'
	},
	stripeSessionId: String,
	stripePaymentIntentId: String,
	status: {
		type: String,
		enum: ['pending', 'paid', 'failed'],
		default: 'pending'
	},
	receiptUrl: String
}, {
	timestamps: true
});

paymentSchema.index({ student: 1, course: 1, stripeSessionId: 1 });

module.exports = mongoose.model('payment', paymentSchema);
