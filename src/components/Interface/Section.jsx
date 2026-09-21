import { motion } from "framer-motion";

const Section = (props) => {
  const { children, mobileTop, position = "left" } = props;

  return (
    <motion.section
      className={`
          h-screen w-screen p-8 max-w-screen-2xl mx-auto
          flex flex-col ${
            position === "right"
              ? "items-end"
              : position === "left"
                ? "items-start"
                : "items-center"
          }
          ${mobileTop ? "justify-start md:justify-center" : "justify-center"}
        `}
      initial={{
        opacity: 0,
        y: 50,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: {
          duration: 1,
          delay: 0.6,
        },
      }}
      transition={{
        duration: 2,
        delay: 0.2,
      }}
    >
      {children}
    </motion.section>
  );
};

export default Section;
