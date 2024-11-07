import CarouselSection from "./Carousel";
import AboutSection from "./About";
import SkillsSection from "./Skills";

const Interface = (props) => {
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

export default Interface;
