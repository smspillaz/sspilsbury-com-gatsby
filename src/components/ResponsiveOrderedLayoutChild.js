import PropTypes from "prop-types"

import styled from "styled-components"

export const LayoutTypes = {
  LEFT: 0,
  RIGHT: 1,
}

export const ResponsiveOrderedLayoutChild = styled.div`
  flex: 1;
  width: 100%;
  order: ${props => props.mobileOrder};
  transition: ${props => (props.transition ? props.transition : "none")};

  @media (min-width: 48em) {
    order: ${props => props.desktopOrder};
    ${props => props.desktopMargin};
  }
`

ResponsiveOrderedLayoutChild.propTypes = {
  desktopOrder: PropTypes.number.isRequired,
  mobileOrder: PropTypes.number.isRequired,
  transition: PropTypes.string,
  desktopMargin: PropTypes.number,
}
