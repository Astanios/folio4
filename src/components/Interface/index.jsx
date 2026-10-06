import AboutSection from "./About";
import SkillsSection from "./Skills";
import ThoughtFieldSection from "./ThoughtField";

const Interface = (props) => {
  const { setSection, selected, setSelected } = props;
  return (
    <div className="flex flex-col items-center w-screen">
      <AboutSection setSection={setSection} />
      <ThoughtFieldSection />
      <section className="h-screen w-screen pointer-events-none" aria-label="Companies island" />
      <SkillsSection />
    </div>
  );
};

export default Interface;
