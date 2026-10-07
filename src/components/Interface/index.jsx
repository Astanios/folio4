import AboutSection from "./About";
import ThoughtFieldSection from "./ThoughtField";

const Interface = () => {
  return (
    <div className="flex flex-col items-center w-screen">
      <AboutSection />
      <ThoughtFieldSection />
      <section className="h-screen w-screen pointer-events-none" aria-label="Companies island" />
      <section className="h-screen w-screen pointer-events-none" aria-label="Contact island" />
    </div>
  );
};

export default Interface;
