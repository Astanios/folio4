const CircleText = ({ children }) => {
  return (
    <div className="quote-wrapper">
      <blockquote className="text">
        {children}
      </blockquote>
    </div>
  );
};

export default CircleText;
