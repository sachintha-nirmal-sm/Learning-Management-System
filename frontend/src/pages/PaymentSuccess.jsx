import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import paymentService from '../services/paymentService';
import '../styles/PaymentResult.css';

const PaymentSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setMessage('Missing payment session identifier.');
      return;
    }

    let redirectTimer;

    const confirmPayment = async () => {
      try {
        const data = await paymentService.confirmPayment(sessionId);
        if (data.success) {
          setStatus('success');
          setMessage('Payment confirmed! You now have access to the course.');
          redirectTimer = setTimeout(() => navigate('/my-courses'), 3000);
        } else {
          setStatus('error');
          setMessage('Payment confirmation failed. Please contact support.');
        }
      } catch (error) {
        setStatus('error');
        const errorMessage = error.response?.data?.message || 'Unable to confirm the payment.';
        setMessage(errorMessage);
      }
    };

    confirmPayment();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [location.search, navigate]);

  return (
    <div className={`payment-result payment-${status}`}>
      <div className="payment-card">
        <div className="payment-icon">
          {status === 'success' && '🎉'}
          {status === 'loading' && '⏳'}
          {status === 'error' && '⚠️'}
        </div>
        <h1>{status === 'success' ? 'Payment Successful' : status === 'error' ? 'Payment Issue' : 'Confirming Payment'}</h1>
        <p>{message || 'Please wait while we confirm your payment.'}</p>

        {status === 'success' && (
          <Link to="/my-courses" className="btn-primary">
            Go to My Courses
          </Link>
        )}

        {status === 'error' && (
          <div className="payment-actions">
            <Link to="/my-courses" className="btn-secondary">
              Back to My Courses
            </Link>
            <Link to="/" className="btn-primary">
              Browse Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
