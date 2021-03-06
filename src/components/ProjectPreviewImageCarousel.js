import React from "react"
import PropTypes from "prop-types"

import { CrossBlurFadeBackgroundImage } from "./CrossBlurFadeBackgroundImage"
import { VisibilityTrackingTimeoutPager } from "./TimeoutPager"

export const ProjectPreviewImageCarousel = ({
  images,
  imageStyleProps = {},
  timeout = 10000,
}) => (
  <VisibilityTrackingTimeoutPager
    range={images.length}
    time={timeout - (Math.random() * timeout) / 2}
    render={({ index, visible }) =>
      images.map((imageUrl, i) => (
        <CrossBlurFadeBackgroundImage
          key={imageUrl}
          url={imageUrl}
          selected={i === index}
          styleProps={imageStyleProps}
          visible={visible}
        />
      ))
    }
  />
)

ProjectPreviewImageCarousel.propTypes = {
  images: PropTypes.arrayOf(PropTypes.string).isRequired,
  imageStyleProps: PropTypes.object,
  timeout: PropTypes.number,
}
