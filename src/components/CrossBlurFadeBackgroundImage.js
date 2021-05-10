import React from "react"
import PropTypes from "prop-types"

import { ImageAbsoluteParent } from "./ImageAbsoluteParent"

export const CrossBlurFadeBackgroundImage = ({
  selected,
  url,
  styleProps = {},
}) => (
  <ImageAbsoluteParent
    key={url}
    style={{
      backgroundImage: ["url(", url, ")"].join(""),
      backgroundSize: "cover",
      backgroundPosition: "center center",
      borderRadius: "8px",
      opacity: selected ? 1 : 0,
      filter: !selected ? "blur(4px)" : undefined,
      transition: "all 0.75s ease-in-out",
      ...styleProps,
    }}
  />
)

CrossBlurFadeBackgroundImage.propTypes = {
  selected: PropTypes.bool.isRequired,
  url: PropTypes.string.isRequired,
  visible: PropTypes.bool,
  styleProps: PropTypes.object,
}
