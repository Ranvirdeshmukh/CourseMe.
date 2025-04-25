import { fontStack } from '../components/theme';

/**
 * A custom hook to provide consistent font styling throughout the application
 * Can be used in any component that needs to reference the font stack
 */
const useAppStyles = () => {
  return {
    fontFamily: fontStack,
    // Use these for specific text elements to maintain consistency
    typography: {
      title: {
        fontFamily: fontStack,
        fontWeight: 600,
      },
      subtitle: {
        fontFamily: fontStack,
        fontWeight: 500,
      },
      body: {
        fontFamily: fontStack,
        fontWeight: 400,
      },
      caption: {
        fontFamily: fontStack,
        fontWeight: 400,
        fontSize: '0.85rem',
      },
      button: {
        fontFamily: fontStack,
        fontWeight: 500,
      },
    },
  };
};

export default useAppStyles; 