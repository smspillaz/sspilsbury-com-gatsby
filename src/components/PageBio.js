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

const ButtonContainer = styled.div`
  margin-top: 1em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
`

const ButtonLink = styled.a`
  &:hover {
    div {
      filter: brightness(125%);
    }
  }
`

const Button = styled.div`
  background-color: var(--color-primary);
  border-radius: 0.2em;
  color: white;
  display: block;
  font-family: var(--fontFamily-sans);
  padding 0.4em;
`

export const PageBio = ({ children, resume }) => {
  return (
    <FlexContainer>
      <div>
        <StaticImage
          className="bio-avatar centered"
          layout="fixed"
          formats={["AUTO", "WEBP", "AVIF"]}
          src="../images/profile-pic.jpg"
          width={200}
          height={200}
          quality={95}
          alt="Profile picture"
        />
        {resume && (
          <ButtonContainer>
            <ButtonLink href={resume} target="_blank">
              <Button>Resume</Button>
            </ButtonLink>
          </ButtonContainer>
        )}
      </div>
      <Description>{children}</Description>
    </FlexContainer>
  )
}
