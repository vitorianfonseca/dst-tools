import { motion, type Transition } from "framer-motion";
 import { ReactNode } from "react";
 
 interface PageTransitionProps {
   children: ReactNode;
 }
 
const pageVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 1.01,
    filter: "blur(4px)",
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  duration: 0.35,
};

 export function PageTransition({ children }: PageTransitionProps) {
   return (
     <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
       className="h-full"
     >
       {children}
     </motion.div>
   );
 }