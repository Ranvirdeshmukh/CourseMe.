import { useEffect, useRef, useState } from 'react';

/**
 * A custom hook that creates an infinite horizontal scroll effect
 * by adding more items when reaching the end of the scroll container.
 * This implementation adds absolute indices to ensure continuous numbering.
 */
function useHorizontalInfiniteScroll(items) {
  const scrollContainerRef = useRef(null);
  const [clonedItems, setClonedItems] = useState([]);
  const [loadCount, setLoadCount] = useState(0);

  // When items change, reset the cloned items with correct indices
  useEffect(() => {
    if (items && items.length > 0) {
      // Add absolute index to each item
      const initialItems = items.map((item, index) => ({
        ...item,
        _loopId: 0,
        _absoluteIndex: index // This will be used for display numbering
      }));
      
      setClonedItems(initialItems);
      setLoadCount(1); // We've loaded one set
    }
  }, [items]);

  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || items.length === 0) return;

      const scrollRight = container.scrollWidth - container.scrollLeft - container.clientWidth;
      
      // If we're close to the end, add more items
      if (scrollRight < 300) {
        const newLoadCount = loadCount + 1;
        setLoadCount(newLoadCount);
        
        // Add new batch with continuous indexing
        const newItems = items.map((item, index) => ({
          ...item,
          _loopId: loadCount, // Track which batch this is from
          _absoluteIndex: index + (items.length * loadCount) // Continue numbering from last batch
        }));
        
        setClonedItems(prev => [...prev, ...newItems]);
      }
    };

    const container = scrollContainerRef.current;
    if (container) container.addEventListener('scroll', handleScroll);
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [items, loadCount]);

  return { scrollContainerRef, clonedItems };
}

export default useHorizontalInfiniteScroll;
