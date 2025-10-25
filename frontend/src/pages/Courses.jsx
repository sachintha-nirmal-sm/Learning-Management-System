import React, { useEffect, useState } from 'react';
import courseService from '../services/courseService';
import CourseCard from '../components/course/CourseCard';
import '../styles/Courses.css';

const categories = ['All', 'Programming', 'Design', 'Business', 'Marketing', 'Photography', 'Music', 'Other'];

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' }
];

const useDebouncedValue = (value, delay = 350) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebouncedValue(searchTerm);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, sortBy, debouncedSearch]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const params = { page, limit: 12 };

        if (selectedCategory && selectedCategory !== 'All') {
          params.category = selectedCategory;
        }

        if (debouncedSearch) {
          params.search = debouncedSearch.trim();
        }

        if (sortBy && sortBy !== 'newest') {
          params.sort = sortBy;
        }

        const data = await courseService.getAllCourses(params);
        setCourses(Array.isArray(data.courses) ? data.courses : []);
        setTotalPages(typeof data.totalPages === 'number' ? data.totalPages : 1);
        setTotalCount(typeof data.total === 'number' ? data.total : 0);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Unable to load courses right now. Please try again later.');
        setCourses([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [page, selectedCategory, sortBy, debouncedSearch]);

  const handlePageChange = (direction) => {
    setPage((current) => {
      if (direction === 'prev') {
        return Math.max(current - 1, 1);
      }
      if (direction === 'next') {
        return Math.min(current + 1, totalPages || 1);
      }
      return current;
    });
  };

  const hasResults = !loading && courses.length > 0;

  return (
    <div className="courses-page">
      <header className="courses-hero">
        <h1>All Courses</h1>
        <p>Browse our catalog of published courses and start learning today.</p>
      </header>

      <section className="courses-controls">
        <div className="search-control">
          <label htmlFor="course-search" className="visually-hidden">Search courses</label>
          <input
            id="course-search"
            type="search"
            placeholder="Search by course name or description"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="filters">
          <div className="filter-group">
            <span className="filter-label">Category:</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <span className="filter-label">Sort by:</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && <div className="courses-feedback error">{error}</div>}

      {loading ? (
        <div className="courses-feedback loading">Loading courses...</div>
      ) : hasResults ? (
        <>
          <div className="courses-summary">
            Showing {courses.length} of {totalCount} courses
          </div>
          <div className="courses-grid">
            {courses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="courses-pagination">
              <button
                type="button"
                className="page-btn"
                onClick={() => handlePageChange('prev')}
                disabled={page === 1}
              >
                Previous
              </button>
              <span className="page-indicator">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="page-btn"
                onClick={() => handlePageChange('next')}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="courses-feedback empty">
          <h2>No courses match your filters yet</h2>
          <p>Adjust your search terms or explore another category to discover more content.</p>
        </div>
      )}
    </div>
  );
};

export default Courses;
