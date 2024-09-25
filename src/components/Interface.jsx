import { ValidationError, useForm } from "@formspree/react";
import { motion } from "framer-motion";
import { useAtom } from "jotai";
import {
  GithubOutlined,
  MailOutlined,
  LinkedinFilled,
} from "@ant-design/icons";
import Carousel from "./Carousel";
import ContactButton from "./ContactButton";

export const Interface = (props) => {
  const { setSection, selected, setSelected } = props;
  return (
    <div className="flex flex-col items-center w-screen">
      <AboutSection setSection={setSection} />
      <SkillsSection />
      <CarouselSection selected={selected} setSelected={setSelected} />
      <SkillsSection />
    </div>
  );
};

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

const SkillsSection = () => {
  return (
    <Section>
      <motion.div
        className="2xl:w-1/2 xl:w-1/2 lg:w-1/2 md:w-1/2 text-justify bg-indigo-500 bg-opacity-30 rounded-lg p-4 content-center"
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
        className="2xl:w-1/2 xl:w-1/2 lg:w-1/2 md:w-1/2 text-justify bg-indigo-500 bg-opacity-30 rounded-lg p-4 mt-8 content-center"
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
        <ContactButton text="&nbsp;linkedin.com/in/Luis-d-castillo-c">
          <LinkedinFilled
            className="icon"
            style={{
              color: "#0072b1",
              fontSize: 26,
              backgroundColor: "#FFF",
              borderRadius: 4,
              margin: 2,
              marginLeft: 4,
            }}
          />
        </ContactButton>

        <ContactButton text="&nbsp;info@luisdanielcastillo.com">
          <MailOutlined
            className="icon"
            style={{
              borderRadius: 4,

              fontSize: 26,
              marginLeft: 4,
            }}
          />
        </ContactButton>

        <ContactButton text="&nbsp;github.com/astanios">
          <GithubOutlined
            className="icon"
            style={{ color: "white", fontSize: 30 }}
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

const CarouselSection = ({ selected, setSelected }) => {
  return (
    <Section right>
      <Carousel selected={selected} setSelected={setSelected} />
    </Section>
  );
};

const ContactSection = () => {
  const [state, handleSubmit] = useForm("mayzgjbd");
  return (
    <Section>
      <h2 className="text-3xl md:text-5xl font-bold text-white">Contact me</h2>
      <div className="mt-8 p-8 rounded-md bg-white bg-opacity-50 w-96 max-w-full">
        {state.succeeded ? (
          <p className="text-gray-900 text-center">Thanks for your message !</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label for="name" className="font-medium text-gray-900 block mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 p-3"
            />
            <label
              for="email"
              className="font-medium text-gray-900 block mb-1 mt-8"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 p-3"
            />
            <ValidationError
              className="mt-1 text-red-500"
              prefix="Email"
              field="email"
              errors={state.errors}
            />
            <label
              for="email"
              className="font-medium text-gray-900 block mb-1 mt-8"
            >
              Message
            </label>
            <textarea
              name="message"
              id="message"
              className="h-32 block w-full rounded-md border-0 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 p-3"
            />
            <ValidationError
              className="mt-1 text-red-500"
              errors={state.errors}
            />
            <button
              disabled={state.submitting}
              className="bg-indigo-600 text-white py-4 px-8 rounded-lg font-bold text-lg mt-16 "
            >
              Submit
            </button>
          </form>
        )}
      </div>
    </Section>
  );
};
