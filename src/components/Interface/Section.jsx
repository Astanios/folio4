import { motion } from "framer-motion";

const Section = (props) => {
  const { children, mobileTop, right = false } = props;

  return (
    <motion.section
      className={`
          h-screen w-screen p-8 max-w-screen-2xl mx-auto
          flex flex-col ${right ? "items-end" : "items-start"}
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
    >
      {children}
    </motion.section>
  );
};

export default Section;
