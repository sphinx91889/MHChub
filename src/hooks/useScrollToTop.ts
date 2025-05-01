import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function useScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const lastPathname = useRef(pathname);

  useEffect(() => {
    // Only scroll to top on POP (back/forward) and PUSH (new navigation)
    // Skip on REPLACE as it's usually used for url updates without navigation
    if (navigationType !== 'REPLACE') {
      // Use smooth scrolling for better UX
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
    
    lastPathname.current = pathname;
  }, [pathname, navigationType]);
}