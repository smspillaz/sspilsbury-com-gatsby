/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import styled from "styled-components"
import { StaticImage } from "gatsby-plugin-image"

const FlexContainer = styled.div`
  flex: 1;
  display: flex;

  flex-direction: column;
  align-items: center;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: center;
    align-items: stretch;
    margin-bottom: 1em;
  }
`

const Description = styled.div`
  flex: 1;
  flex-grow: 1;
  align-items: center;
  display: flex;

  @media (max-width: 767px) {
    margin-top: 1em;
  }
`

export const PageBio = ({ children }) => {
  return (
    <FlexContainer>
      <StaticImage
        className="bio-avatar"
        layout="fixed"
        formats={["AUTO", "WEBP", "AVIF"]}
        src="../images/profile-pic.jpg"
        style={{}}
        width={200}
        height={200}
        quality={95}
        alt="Profile picture"
      />
      <Description>{children}</Description>
    </FlexContainer>
  )
}
