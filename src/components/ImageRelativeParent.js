import PropTypes from "prop-types"

import styled from "styled-components"

export const ImageRelativeParent = styled.div`
  position: relative;
  height: ${props => props.mobileHeight};
  width: 100%;
  transition: ${props => (props.transition ? props.transition : "none")};

  @media (min-width: 48em) {
    height: ${props => props.contractedHeight};
  }
`

ImageRelativeParent.propTypes = {
  expandedHeight: PropTypes.string.isRequired,
  contractedHeight: PropTypes.string.isRequired,
  mobileHeight: PropTypes.string.isRequired,
  transition: PropTypes.string,
}
