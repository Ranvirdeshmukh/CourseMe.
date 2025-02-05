import { useEffect, useRef } from 'react';

function useInfiniteScroll(fetchMore) {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollRight = container.scrollWidth - container.scrollLeft - container.clientWidth;
      // When near the right edge, call the fetchMore callback
      if (scrollRight < 100) {
        fetchMore();
      }
    };

    const container = scrollContainerRef.current;
    if (container) container.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [fetchMore]);

  return { scrollContainerRef };
}

export default useInfiniteScroll;
