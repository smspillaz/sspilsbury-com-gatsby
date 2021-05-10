import React from "react"
import PropTypes from "prop-types"
import { Link } from "gatsby"

import styled from "styled-components"

import { CrossFadeContainer } from "./CrossFadeContainer"
import { ImageRelativeParent } from "./ImageRelativeParent"
import {
  LayoutTypes,
  ResponsiveOrderedLayoutChild,
} from "./ResponsiveOrderedLayoutChild"

export const ProjectImageBox = ({
  desktopOrder,
  mobileOrder,
  desktopWidth,
  mobileHeight,
  expandedHeight,
  contractedHeight,
  transition,
  children,
  style = {},
}) => (
  <ResponsiveOrderedLayoutChild
    width={[1, 1, 1, desktopWidth]}
    m={1}
    style={style}
    desktopOrder={desktopOrder}
    mobileOrder={mobileOrder}
    transition={transition}
  >
    <ImageRelativeParent
      transition={transition}
      expandedHeight={expandedHeight}
      contractedHeight={contractedHeight}
      mobileHeight={mobileHeight}
    >
      {children}
    </ImageRelativeParent>
  </ResponsiveOrderedLayoutChild>
)

ProjectImageBox.propTypes = {
  desktopOrder: PropTypes.number.isRequired,
  mobileOrder: PropTypes.number.isRequired,
  mobileHeight: PropTypes.string.isRequired,
  desktopWidth: PropTypes.number.isRequired,
  expandedHeight: PropTypes.string.isRequired,
  contractedHeight: PropTypes.string.isRequired,
  transition: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  style: PropTypes.object,
}

export const ProjectDescriptionBox = ({
  header,
  subtitle,
  client,
  description,
  desktopOrder,
  mobileOrder,
  desktopWidth,
  url,
  style = {},
}) => (
  <ResponsiveOrderedLayoutChild
    width={[1, 1, 1, desktopWidth]}
    p={5}
    style={style}
    desktopOrder={desktopOrder}
    mobileOrder={mobileOrder}
    desktopMargin={{
      marginLeft: desktopOrder === 1 ? "2em" : 0,
      marginRight: desktopOrder === -1 ? "2em" : 0,
    }}
  >
    <Link to={url}>
      <h2>{header}</h2>
    </Link>
    {subtitle && <p>{subtitle}</p>}
    {client && (
      <Link to={client.url}>
        <p>{client.name}</p>
      </Link>
    )}
    {<p>{description}</p>}
  </ResponsiveOrderedLayoutChild>
)

ProjectDescriptionBox.propTypes = {
  header: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  client: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }),
  description: PropTypes.string,
  desktopOrder: PropTypes.number.isRequired,
  mobileOrder: PropTypes.number.isRequired,
  desktopWidth: PropTypes.number.isRequired,
  url: PropTypes.string,
  style: PropTypes.object,
}

const ResponsiveFlex = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: 48em) {
    flex-direction: ${props => props.direction};
  }
`

ResponsiveFlex.propTypes = {
  direction: PropTypes.string.isRequired,
}

// eslint-disable-next-line
export class ProjectPreview extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      expanded: false,
    }
  }

  handleClick = () => this.setState(state => ({ expanded: !state.expanded }))

  render() {
    const {
      header,
      subtitle,
      client,
      description,
      layout,
      url,
      canRenderContractedPreview,
      renderContractedPreview,
      renderExpandedPreview,
    } = this.props

    return (
      <ResponsiveFlex
        width={[1]}
        mt={3}
        direction={this.state.expanded ? "column" : "row"}
      >
        {canRenderContractedPreview ? (
          <ProjectImageBox
            desktopOrder={1}
            mobileOrder={1}
            desktopWidth={this.state.expanded ? 1.0 : 0.4}
            mobileHeight="45vh"
            expandedHeight="480px"
            contractedHeight={this.state.expanded ? "480px" : "320px"}
            transition="all 1.5s ease-in-out"
            style={{
              alignSelf:
                layout === LayoutTypes.LEFT ? "flex-begin" : "flex-end",
            }}
          >
            {renderExpandedPreview ? (
              <div>
                <CrossFadeContainer selected={!this.state.expanded}>
                  {renderContractedPreview({ selected: this.state.expanded })}
                </CrossFadeContainer>
                <CrossFadeContainer selected={this.state.expanded}>
                  {renderExpandedPreview({ selected: this.state.expanded })}
                </CrossFadeContainer>
              </div>
            ) : (
              renderContractedPreview({ selected: true })
            )}
          </ProjectImageBox>
        ) : (
          <span />
        )}
        <ProjectDescriptionBox
          header={header}
          subtitle={subtitle}
          client={client}
          description={description}
          desktopOrder={
            this.state.expanded || layout === LayoutTypes.LEFT ? 1 : -1
          }
          desktopWidth={
            this.state.expanded || !canRenderContractedPreview ? 1.0 : 0.5
          }
          url={url}
          mobileOrder={1}
        />
      </ResponsiveFlex>
    )
  }
}

ProjectPreview.propTypes = {
  header: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  client: PropTypes.shape({
    name: PropTypes.string.isRequired,
    url: PropTypes.string,
  }),
  description: PropTypes.string,
  url: PropTypes.string,
  layout: PropTypes.number,
  renderContractedPreview: PropTypes.func.isRequired,
  renderExpandedPreview: PropTypes.func,
  canRenderContractedPreview: PropTypes.bool,
}

ProjectPreview.defaultProps = {
  client: null,
  description: "",
  subtitle: null,
  url: null,
  layout: LayoutTypes.LEFT,
  canRenderContractedPreview: true,
}
