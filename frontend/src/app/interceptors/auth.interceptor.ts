// OBJECTIVE: Automatically attach the authentication token to every HTTP request sent to the backend.
// HOW IT WORKS: Whenever an Angular service (like PaymentService or ChatService) makes a request,
// this interceptor catches it before it leaves the browser. It retrieves the JWT token from localStorage
// (saved by AuthService during login) and adds it to the 'Authorization' header. The Django backend
// then reads this header to verify the user's identity.

import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Retrieve the JWT token saved from the backend login response
  const token = localStorage.getItem('token');
  if (token) {
    // Clone the request and inject the Authorization header with the Bearer token
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // Send the modified request to the Django backend
    return next(cloned);
  }
  // If no token exists (e.g. before login), send the request unmodified
  return next(req);
};
