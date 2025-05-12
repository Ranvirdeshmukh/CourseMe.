import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const ParticleTextAnimation = ({
  text,
  textColor,
  onComplete,
  darkMode,
  endingPunctuation,
  endingPunctuationColor,
  isTransitioning
}) => {
  const [opacity, setOpacity] = useState(0);
  const [showPunctuation, setShowPunctuation] = useState(false);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Create particle effect without tsparticles
  useEffect(() => {
    const particleCount = 40; // Reduced particle count for more elegance
    const particles = [];
    
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Function to determine if the text is a time-based greeting
    const isTimeGreeting = (txt) => {
      return txt.startsWith('Good morning') || 
             txt.startsWith('Good afternoon') || 
             txt.startsWith('Good evening') ||
             txt.startsWith('Good night');
    };
    
    // Determine particle color based on text
    const getParticleColors = () => {
      if (darkMode) return ["#FFFFFF"];
      
      // For time-based greetings, create a nice gradient effect with 2-3 colors
      if (text && isTimeGreeting(text)) {
        if (text.startsWith('Good morning')) {
          return ["#FF9800", "#FFC107", "#FFEB3B"]; // Morning colors (orange, amber, yellow)
        } else if (text.startsWith('Good afternoon')) {
          return ["#00693e", "#4CAF50", "#8BC34A"]; // Afternoon colors (green variants)
        } else if (text.startsWith('Good evening')) {
          return ["#3F51B5", "#673AB7", "#9C27B0"]; // Evening colors (indigo, deep purple, purple)
        } else if (text.startsWith('Good night')) {
          return ["#673AB7", "#9C27B0", "#311B92"]; // Night colors (deeper purples and indigo)
        }
      }
      
      // Default case - use the textColor or fallback
      return [textColor || (darkMode ? "#FFFFFF" : "#000000")];
    };
    
    const particleColors = getParticleColors();
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      // More varied sizes for visual interest
      const size = Math.random() * 3 + 1;
      
      // Select a random color from our palette
      const colorIndex = Math.floor(Math.random() * particleColors.length);
      const particleColor = particleColors[colorIndex];
      
      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = particleColor;
      // More subtle opacity
      particle.style.opacity = (Math.random() * 0.4 + 0.1).toString();
      particle.style.pointerEvents = 'none';
      particle.style.transition = 'opacity 0.8s ease-in-out'; // Smooth opacity transitions
      
      // Random position
      particle.style.left = `${Math.random() * containerWidth}px`;
      particle.style.top = `${Math.random() * containerHeight}px`;
      
      // Set velocity - much slower for elegance
      const vx = (Math.random() - 0.5) * 1.2;
      const vy = (Math.random() - 0.5) * 1.2;
      
      particles.push({
        element: particle,
        vx,
        vy,
        size,
        color: particleColor,
        originalOpacity: parseFloat(particle.style.opacity)
      });
      
      container.appendChild(particle);
    }
    
    particlesRef.current = particles;
    
    // Start animation
    const animate = () => {
      particles.forEach(particle => {
        // Get current position
        const x = parseFloat(particle.element.style.left);
        const y = parseFloat(particle.element.style.top);
        
        // Move particle with easing
        let newX = x + particle.vx;
        let newY = y + particle.vy;
        
        // Bounce off walls with damping for more natural movement
        if (newX <= 0 || newX >= containerWidth) {
          particle.vx *= -0.8; // Damping factor
          newX = x + particle.vx;
        }
        
        if (newY <= 0 || newY >= containerHeight) {
          particle.vy *= -0.8; // Damping factor
          newY = y + particle.vy;
        }
        
        // Gradually slow down for natural movement
        particle.vx *= 0.995;
        particle.vy *= 0.995;
        
        // Occasionally add tiny random impulses for organic movement
        if (Math.random() < 0.02) {
          particle.vx += (Math.random() - 0.5) * 0.3;
          particle.vy += (Math.random() - 0.5) * 0.3;
        }
        
        // Update position
        particle.element.style.left = `${newX}px`;
        particle.element.style.top = `${newY}px`;
        
        // Subtle opacity variations for visual depth
        if (Math.random() < 0.01) {
          const newOpacity = particle.originalOpacity * (0.8 + Math.random() * 0.4);
          particle.element.style.opacity = newOpacity.toString();
        }
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Animate text appearance with a delay for more elegance
    if (!isTransitioning) {
      setOpacity(0);
      setTimeout(() => {
        setOpacity(1);
        setTimeout(() => {
          setShowPunctuation(true);
          setTimeout(() => {
            if (onComplete) onComplete(text);
          }, 400);
        }, 600);
      }, 200);
    }
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      particles.forEach(particle => {
        if (particle.element.parentNode) {
          particle.element.parentNode.removeChild(particle.element);
        }
      });
    };
  }, [text, darkMode, textColor, onComplete, isTransitioning]);
  
  // Handle mouse movement - make particles react
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    particlesRef.current.forEach(particle => {
      const particleX = parseFloat(particle.element.style.left);
      const particleY = parseFloat(particle.element.style.top);
      
      // Calculate vector from mouse to particle
      const dx = particleX - mouseX;
      const dy = particleY - mouseY;
      
      // Calculate distance
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Apply subtle force if close enough, more Apple-like gentle interaction
      if (distance < 120) {
        const forceFactor = Math.pow((120 - distance) / 120, 2) * 0.3; // Quadratic falloff, gentler
        
        if (distance > 30) { // Don't affect particles too close to cursor
          particle.vx += (dx / distance) * forceFactor;
          particle.vy += (dy / distance) * forceFactor;
        }
        
        // Cap velocity to maintain elegance
        const maxVelocity = 3;
        const velocityMagnitude = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (velocityMagnitude > maxVelocity) {
          const scale = maxVelocity / velocityMagnitude;
          particle.vx *= scale;
          particle.vy *= scale;
        }
        
        // Subtle opacity change on hover
        particle.element.style.opacity = (particle.originalOpacity * 1.5).toString();
      } else {
        // Restore original opacity with transition
        particle.element.style.opacity = particle.originalOpacity.toString();
      }
    });
  };
  
  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: "90px",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        marginBottom: "10px"
      }}
      onMouseMove={handleMouseMove}
    >
      {/* Text and punctuation container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          transition: 'opacity 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)',
          opacity: isTransitioning ? 0 : opacity
        }}
      >
        {/* Text display */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: 'SF Pro Display, sans-serif',
            fontWeight: 600,
            fontSize: { xs: '2rem', md: '3rem' },
            color: textColor || (darkMode ? "#FFFFFF" : "#000000"),
            letterSpacing: '0.04rem',
            textShadow: darkMode ? '0 0 20px rgba(255,255,255,0.1)' : 'none' // Subtle glow in dark mode
          }}
        >
          {text}
        </Typography>
        
        {/* Punctuation mark with special styling */}
        {endingPunctuation && (
          <Typography
            variant="h3"
            sx={{
              fontFamily: 'SF Pro Display, sans-serif',
              fontWeight: 600,
              fontSize: { xs: '2rem', md: '3rem' },
              color: endingPunctuationColor || "#F26655",
              marginLeft: "2px",
              opacity: showPunctuation ? 1 : 0,
              transition: "opacity 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)", // Apple-like easing
            }}
          >
            {endingPunctuation}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ParticleTextAnimation; 