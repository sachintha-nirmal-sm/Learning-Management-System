// This file exports the data models used in the application, such as User, Course, Enrollment, Payment, and Content.

const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Payment = require('./Payment');
const Content = require('./Content');

module.exports = {
    User,
    Course,
    Enrollment,
    Payment,
    Content
};