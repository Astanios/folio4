import { motion } from "framer-motion";
import Section from "./Section";
import CircleText from "./CircleText";

const SkillsSection = () => {
  return (
    <Section position={"center"}>
      <motion.div
        className="w-full flex justify-center"
        initial={{
          opacity: 0,
          y: 25,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 2,
          delay: 0.5,
        }}
      >
        {/* <h2 className="text-3xl md:text-5xl font-bold text-white">About me:</h2>
          <br />{" "} */}
        <CircleText>
          <>
            <p className="circle-copy">
              I'd love to say that I helped Linus Torvalds build the Linux
              kernel, but that would be a blatant lie.
              <br />
              <br /> As the 21st century philosopher Jon Lajoie said: I'm just a
              regular everyday normal developer.
              <br />
              <br />
              Since I can remember, I've always enjoyed building, legos,
              sandcastles, furniture, software, motors, you name it. So when the
              time to pick a career came Computer Science seemed like the only
              logical choice, best choice ever.
            </p>
          </>
        </CircleText>
      </motion.div>
    </Section>
  );
};
export default SkillsSection;
