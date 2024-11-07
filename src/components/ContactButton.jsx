import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ContactButton = ({ text = "Hover me!", children, link = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const renderText = () => {
    if (link) {
      return (
        <a href={`https://www.${text}`} target="_blank">
          {text}
        </a>
      );
    } else {
      return text;
    }
  };

  return (
    <motion.div
      className="inline-flex items-center cursor-pointer my-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        <motion.div
          className="cursor-pointer flex items-center justify-center rounded-3xl text-white p-1.5 bg-indigo-500 bg-opacity-30"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
          {renderText()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ContactButton;
