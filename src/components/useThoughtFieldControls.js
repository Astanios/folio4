import { folder, useControls } from "leva";

const transform = (key, position, scale) => ({
  [`${key}Position`]: { label: "position", value: position, step: 0.05 },
  [`${key}Scale`]: { label: "scale", value: scale, min: 0.1, max: 6, step: 0.05 },
});

export default function useThoughtFieldControls(layout, isMobile) {
  const [values] = useControls("Section 2 Hand & Orb", () => {
    return {
      Desktop: folder({
        Hand: folder(transform("hand", layout.hand.position, layout.hand.scale)),
        Orb: folder(transform("orb", layout.orb.position, layout.orb.scale)),
      }),
      "Mobile (<768px)": folder({
        Hand: folder(transform("mobileHand", layout.mobile.hand.position, layout.mobile.hand.scale)),
        Orb: folder(transform("mobileOrb", layout.mobile.orb.position, layout.mobile.orb.scale)),
      }, { collapsed: true }),
    };
  }, [layout]);

  // Each profile controls the models' actual local transforms directly.
  return isMobile
    ? { handPosition: values.mobileHandPosition, handScale: values.mobileHandScale,
      orbPosition: values.mobileOrbPosition, orbScale: values.mobileOrbScale }
    : { handPosition: values.handPosition, handScale: values.handScale,
      orbPosition: values.orbPosition, orbScale: values.orbScale };
}
