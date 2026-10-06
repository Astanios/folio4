import Section from "./Section";

const AboutSection = () => {
  return (
    <Section>
      <h1 className="text-4xl md:text-6xl font-extrabold leading-snug mt-8 md:mt-0 content-center">
        <div className="text-white my-1">Welcome</div>
        <span className="bg-white px-1 italic">I'm Luis</span>
      </h1>

    </Section>
  );
};

export default AboutSection;
