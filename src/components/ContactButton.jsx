import {
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
} from "@ant-design/icons";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarOutlined } from "@ant-design/icons";

const ContactButton = ({ text = "Hover me!", children }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="inline-flex items-center cursor-pointer my-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        <motion.div
          className="cursor-pointer flex items-center justify-center rounded-3xl text-white p-1.5 bg-stone-700"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
          {text}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default ContactButton;
