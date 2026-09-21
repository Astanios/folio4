import { useState } from "react";
import { Html } from "@react-three/drei";

import {
  GithubOutlined,
  MailOutlined,
  LinkedinFilled,
} from "@ant-design/icons";
const TextWithModel = ({
  font,
  fontSize,
  letterSpacing,
  color,
  text,
  children,
  ...otherProps
}) => {
  const [isOccluded, setOccluded] = useState();
  const [isInRange, setInRange] = useState();

  const isVisible = isInRange && !isOccluded;
  return (
    <group {...otherProps}>
      <group>
        <Html
          // 3D-transform contents
          transform
          // Hide contents "behind" other meshes
          occlude
          // Tells us when contents are occluded (or not)
          onOcclude={setOccluded}
          // We just interpolate the visible state into css opacity and transforms
          style={{
            transition: "all 0.2s",
            opacity: isVisible ? 1 : 0,
            transform: `scale(${isVisible ? 1 : 0.25})`,
          }}
        >
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
          <h1>{text}</h1>
        </Html>
      </group>
      {children}
    </group>
  );
};

export default TextWithModel;
