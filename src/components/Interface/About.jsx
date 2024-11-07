import Section from "./Section";

const AboutSection = (props) => {
  // const { setSection } = props;
  return (
    <Section>
      <h1 className="text-4xl md:text-6xl font-extrabold leading-snug mt-8 md:mt-0 content-center">
        <div className="text-white my-1">Welcome</div>
        <span className="bg-white px-1 italic">I'm Luis</span>
      </h1>
      {/* <motion.p
          className="text-lg text-gray-600 mt-4"
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
            delay: 1.5,
          }}
        >
          I make cool stuff with Javascript
        </motion.p>
        <motion.button
          onClick={() => setSection(3)}
          className={`bg-indigo-600 text-white py-4 px-8 
        rounded-lg font-bold text-lg mt-4 md:mt-16`}
          initial={{
            opacity: 0,
            y: 25,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 1,
            delay: 2,
          }}
        >
          Contact me
        </motion.button> */}
    </Section>
  );
};

export default AboutSection;
