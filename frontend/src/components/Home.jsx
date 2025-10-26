import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../services/courseService';
import CourseCard from '../components/course/CourseCard';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { isInstructor, isAuthenticated } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await courseService.getPopularCourses({ limit: 3 });
      setCourses(Array.isArray(data.courses) ? data.courses : []);
      setError('');
    } catch (err) {
      setError('Failed to load popular courses');
      console.error(err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses
    .filter((course) =>
      (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((course) =>
      selectedCategory === 'All' ? true : course.category === selectedCategory
    );

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Learn Without Limits</h1>
          <p>Start, switch, or advance your career with thousands of courses</p>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-btn">Search</button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories-section">
        <div className="container">
          <h2>Browse by Category</h2>
          <div className="categories">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="courses-section">
        <div className="container">
          <h2>Popular Courses</h2>
          
          {loading && <div className="loading">Loading courses...</div>}
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && filteredCourses.length === 0 && (
            <div className="no-courses">
              <p>No courses found.</p>
              {isInstructor ? (
                <Link to="/instructor/create-course" className="btn-primary">
                  Create Course
                </Link>
              ) : (
                <span className="no-courses-hint">
                  {isAuthenticated
                    ? 'Try adjusting your search or category filters.'
                    : 'Sign in to see personalized recommendations.'}
                </span>
              )}
            </div>
          )}

          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2>Why Choose Our Platform?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Expert Instructors</h3>
              <p>Learn from industry professionals and experts</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Flexible Learning</h3>
              <p>Study at your own pace, anytime, anywhere</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Access</h3>
              <p>Access courses on any device</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Certificates</h3>
              <p>Earn certificates upon course completion</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;