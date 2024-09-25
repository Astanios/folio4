import {
  GithubOutlined,
  LinkedinOutlined,
  MailOutlined,
} from "@ant-design/icons";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarOutlined } from "@ant-design/icons";

const HoverExpandIcon = ({ text = "Hover me!" }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      style={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <StarOutlined style={{ fontSize: 24, marginRight: 8, color: "white" }} />
      <AnimatePresence>
        {isHovered && (
          <motion.div
            style={{
              backgroundColor: "#f0f0f0",
              borderRadius: 20,
              padding: "4px 12px",
              whiteSpace: "nowrap",
              originX: 0,
            }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={{ duration: 0.3 }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Header = () => {
  /* Generate Header coponent with three elements Github, Linkedin and Email  from left to right */

  return (
    <div className="w-full h-16 flex justify-start top-0 bg-transparent fixed">
      <div className="w-1/12 flex justify-between m-10 sa">
        <GithubOutlined
          className="icon"
          style={{ color: "white", fontSize: 30 }}
        />
        <LinkedinOutlined
          className="icon"
          style={{ color: "white", fontSize: 30 }}
        />
        <MailOutlined
          className="icon"
          style={{ color: "white", fontSize: 30 }}
        />
        <HoverExpandIcon />
      </div>
    </div>
  );
};

export default Header;
