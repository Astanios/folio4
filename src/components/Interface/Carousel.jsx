import Section from "./Section";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "../../utils/wrap";
import { IMAGES } from "../../utils/images";
import "../styles.scss";

const sliderVariants = {
  incoming: (direction) => ({
    x: direction > 0 ? "100%" : "-100%",
    scale: 2,
    opacity: 0,
  }),
  active: { x: 0, scale: 1, opacity: 1 },
  exit: (direction) => ({
    x: direction > 0 ? "-100%" : "100%",
    scale: 0.1,
    opacity: 0,
  }),
};

const sliderTransition = {
  duration: 1,
  ease: [0.56, 0.03, 0.12, 1.04],
};

const Carousel = ({ selected, setSelected }) => {
  const [[imageCount, direction], setImageCount] = useState([0, 0]);

  const activeImageIndex = wrap(0, IMAGES.length, imageCount);

  const swipeToImage = (swipeDirection) => {
    setImageCount([imageCount + swipeDirection, swipeDirection]);
    setSelected(imageCount + swipeDirection);
  };

  const dragEndHandler = (dragInfo) => {
    const draggedDistance = dragInfo.offset.x;
    const swipeThreshold = 50;
    if (draggedDistance > swipeThreshold) {
      swipeToImage(-1);
    } else if (draggedDistance < -swipeThreshold) {
      swipeToImage(1);
    }
  };

  const skipToImage = (imageId) => {
    let changeDirection;
    if (imageId > activeImageIndex) {
      changeDirection = 1;
    } else if (imageId < activeImageIndex) {
      changeDirection = -1;
    }
    setImageCount([imageId, changeDirection]);
    setSelected(imageId);
  };

  useEffect(() => {
    skipToImage(selected);
  }, [selected]);

  return (
    <div className="slider-container">
      <div className="slider">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={imageCount}
            // style={{
            //   backgroundImage: `url(${IMAGES[activeImageIndex].imageSrc})`,
            // }}
            custom={direction}
            variants={sliderVariants}
            initial="incoming"
            animate="active"
            exit="exit"
            transition={sliderTransition}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(_, dragInfo) => dragEndHandler(dragInfo)}
            className="image flex justify-center items-center p-4"
          >
            <div className="p-4">
              <div className="border-indigo-600 rounded-r-2xl border-2">
                <img
                  className="rounded-2xl"
                  src={IMAGES[activeImageIndex].image}
                />
              </div>
              <h1 className="text-slate-200 text-4xl font-bold my-4 font-mono">
                {IMAGES[activeImageIndex].title}
              </h1>
              <p className="text-slate-300 text-base leading-tight text-justify">
                {IMAGES[activeImageIndex].description}
              </p>
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-3xl mt-4">
                <a href={IMAGES[activeImageIndex].url}>Visit web</a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* 
        <div className="buttons">
          <button onClick={() => swipeToImage(-1)}>PREV</button>
          <button onClick={() => swipeToImage(1)}>NEXT</button>
        </div>
      </div>

      <div className="thumbnails">
        {IMAGES.map((image) => (
          <div
            key={image.id}
            onClick={() => skipToImage(image.id)}
            className="thumbnail-container"
          >
            <img src={image.imageSrc} alt="Musician" />
            <div
              className={`active-indicator ${
                image.id === activeImageIndex ? "active" : null
              }`}
            />
          </div>
        ))} */}
    </div>
  );
};

const CarouselSection = ({ selected, setSelected }) => {
  return (
    <Section right>
      <Carousel selected={selected} setSelected={setSelected} />
    </Section>
  );
};

export default CarouselSection;
