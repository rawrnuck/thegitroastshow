import React from "react";
import { motion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
}) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      filter: "blur(8px)",
      y: 20,
    },
    enter: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const, // Custom easing
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      scale: 1.05,
      filter: "blur(8px)",
      y: -20,
      transition: {
        duration: 0.4,
        ease: "easeInOut" as const,
      },
    },
  };

  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
