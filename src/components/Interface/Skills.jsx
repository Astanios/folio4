import { motion } from "framer-motion";
import {
  GithubOutlined,
  MailOutlined,
  LinkedinFilled,
} from "@ant-design/icons";
import ContactButton from "../ContactButton";
import Section from "./Section";

const SkillsSection = () => {
  return (
    <Section>
      <motion.div
        className="2xl:w-1/3 xl:w-1/3 lg:w-1/3 md:w-1/3 text-justify bg-indigo-500 bg-opacity-30 rounded-lg p-4 content-center"
        initial={{
          opacity: 0,
          y: 25,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          delay: 0.5,
        }}
      >
        {/* <h2 className="text-3xl md:text-5xl font-bold text-white">About me:</h2>
          <br />{" "} */}
        <p className="whitespace-pre-wrap text-white text-xl">
          <b>I'm a Software Engineer based in Madrid.</b> &#10;I'm passionate
          about data engineering, computer vision and beautiful interfaces.
        </p>
      </motion.div>
      <motion.div
        className="2xl:w-1/3 xl:w-1/3 lg:w-1/3 md:w-1/3 text-justify bg-indigo-500 bg-opacity-30 rounded-lg p-4 mt-8 content-center"
        initial={{
          opacity: 0,
          y: 25,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.7,
          delay: 0.5,
        }}
      >
        <p className="whitespace-pre-wrap text-white text-lg">
          I started developing in 2016. Throughout the years I've built
          different platforms, services and interesting products overall.
          Nowadays I focus on building intuitive interfaces for our customers at
          Genasys. In the physical world you can find me weight lifting,
          traveling or eating pizza.
        </p>
      </motion.div>
      <motion.div
        className="2xl:w-1/2 xl:w-1/2 lg:w-1/2 md:w-1/2 text-justify mt-8 flex flex-col"
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
          delay: 1,
        }}
      >
        <ContactButton text="linkedin.com/in/Luis-d-castillo-c" link>
          <LinkedinFilled
            className="icon"
            style={{
              color: "#0072b1",
              fontSize: 26,
              backgroundColor: "#FFF",
              borderRadius: 4,
              margin: 2,
              marginLeft: 4,
              marginRight: 6,
            }}
          />
        </ContactButton>

        <ContactButton text="info@luisdanielcastillo.com">
          <MailOutlined
            className="icon"
            style={{
              borderRadius: 4,
              marginRight: 6,
              fontSize: 26,
              marginLeft: 4,
            }}
          />
        </ContactButton>

        <ContactButton text="github.com/astanios" link>
          <GithubOutlined
            className="icon"
            style={{
              color: "white",
              fontSize: 30,
              marginRight: 6,
            }}
          />
        </ContactButton>
      </motion.div>

      {/* <div className="mt-8 space-y-4">
            {skills.map((skill, index) => (
              <div className="w-full md:w-64" key={index}>
                <motion.h3
                  className="text-lg md:text-xl font-bold text-gray-100"
                  initial={{
                    opacity: 0,
                  }}
                  variants={{
                    visible: {
                      opacity: 1,
                      transition: {
                        duration: 1,
                        delay: 1 + index * 0.2,
                      },
                    },
                  }}
                >
                  {skill.title}
                </motion.h3>
                <div className="h-2 w-full bg-gray-200 rounded-full mt-2">
                  <motion.div
                    className="h-full bg-indigo-500 rounded-full "
                    style={{ width: `${skill.level}%` }}
                    initial={{
                      scaleX: 0,
                      originX: 0,
                    }}
                    variants={{
                      visible: {
                        scaleX: 1,
                        transition: {
                          duration: 1,
                          delay: 1 + index * 0.2,
                        },
                      },
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mt-10 text-white">
              Languages
            </h2>
            <div className="mt-8 space-y-4">
              {languages.map((lng, index) => (
                <div className="w-full md:w-64" key={index}>
                  <motion.h3
                    className="text-lg md:text-xl font-bold text-gray-100"
                    initial={{
                      opacity: 0,
                    }}
                    variants={{
                      visible: {
                        opacity: 1,
                        transition: {
                          duration: 1,
                          delay: 2 + index * 0.2,
                        },
                      },
                    }}
                  >
                    {lng.title}
                  </motion.h3>
                  <div className="h-2 w-full bg-gray-200 rounded-full mt-2">
                    <motion.div
                      className="h-full bg-indigo-500 rounded-full "
                      style={{ width: `${lng.level}%` }}
                      initial={{
                        scaleX: 0,
                        originX: 0,
                      }}
                      variants={{
                        visible: {
                          scaleX: 1,
                          transition: {
                            duration: 1,
                            delay: 2 + index * 0.2,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div> */}
    </Section>
  );
};
export default SkillsSection;
