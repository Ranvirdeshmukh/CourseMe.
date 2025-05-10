import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';

const ParticleTextAnimation = ({
  text,
  textColor,
  onComplete,
  darkMode,
  endingPunctuation,
  endingPunctuationColor
}) => {
  const [opacity, setOpacity] = useState(0);
  const [showPunctuation, setShowPunctuation] = useState(false);
  const containerRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef(null);

  // Create particle effect without tsparticles
  useEffect(() => {
    const particleCount = 50;
    const particles = [];
    
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      const size = Math.random() * 4 + 1;
      
      particle.style.position = 'absolute';
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.borderRadius = '50%';
      particle.style.backgroundColor = textColor || (darkMode ? "#FFFFFF" : "#000000");
      particle.style.opacity = (Math.random() * 0.5 + 0.3).toString();
      particle.style.pointerEvents = 'none';
      
      // Random position
      particle.style.left = `${Math.random() * containerWidth}px`;
      particle.style.top = `${Math.random() * containerHeight}px`;
      
      // Set velocity
      const vx = (Math.random() - 0.5) * 2;
      const vy = (Math.random() - 0.5) * 2;
      
      particles.push({
        element: particle,
        vx,
        vy,
        size
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
        
        // Move particle
        let newX = x + particle.vx;
        let newY = y + particle.vy;
        
        // Bounce off walls
        if (newX <= 0 || newX >= containerWidth) {
          particle.vx *= -1;
          newX = x + particle.vx;
        }
        
        if (newY <= 0 || newY >= containerHeight) {
          particle.vy *= -1;
          newY = y + particle.vy;
        }
        
        // Update position
        particle.element.style.left = `${newX}px`;
        particle.element.style.top = `${newY}px`;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Animate text appearance
    setOpacity(0);
    setTimeout(() => {
      setOpacity(1);
      setTimeout(() => {
        setShowPunctuation(true);
        setTimeout(() => {
          if (onComplete) onComplete(text);
        }, 400);
      }, 600);
    }, 100);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      particles.forEach(particle => {
        if (particle.element.parentNode) {
          particle.element.parentNode.removeChild(particle.element);
        }
      });
    };
  }, [text, darkMode, textColor, onComplete]);
  
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
      
      // Apply force if close enough
      if (distance < 100) {
        const forceFactor = (100 - distance) / 100;
        particle.vx += (dx / distance) * forceFactor * 0.5;
        particle.vy += (dy / distance) * forceFactor * 0.5;
        
        // Cap velocity
        const maxVelocity = 5;
        const velocityMagnitude = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (velocityMagnitude > maxVelocity) {
          const scale = maxVelocity / velocityMagnitude;
          particle.vx *= scale;
          particle.vy *= scale;
        }
      }
    });
  };
  
  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: "100px",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
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
          transition: 'opacity 0.5s ease-in-out',
          opacity
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
              transition: "opacity 0.3s ease-in",
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