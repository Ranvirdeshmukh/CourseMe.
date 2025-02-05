import { useEffect, useRef, useState } from 'react';

/**
 * A simple custom hook that clones the original items when
 * scrolling reaches the end, simulating infinite horizontal scroll.
 * Replace the "setClonedItems([...prev, ...items])" part with
 * a real server call if you want genuine pagination from Firestore.
 */
function useHorizontalInfiniteScroll(items) {
  const scrollContainerRef = useRef(null);
  const [clonedItems, setClonedItems] = useState(items);

  useEffect(() => {
    setClonedItems(items);
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollRight = container.scrollWidth - container.scrollLeft - container.clientWidth;
      if (scrollRight < 100) {
        setClonedItems((prev) => [...prev, ...items]);
      }
    };

    const container = scrollContainerRef.current;
    if (container) container.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [items]);

  return { scrollContainerRef, clonedItems };
}

export default useHorizontalInfiniteScroll;
