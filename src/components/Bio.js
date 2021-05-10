/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import * as React from "react"
import { StaticQuery, graphql } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"

const Bio = () => {
  return (
    <StaticQuery
      query={graphql`
        query BioQuery {
          site {
            siteMetadata {
              author {
                name
                summary
              }
            }
          }
        }
      `}
      render={({ site }) => {
        const author = site.siteMetadata?.author
        return (
          <div className="bio">
            <StaticImage
              className="bio-avatar"
              layout="fixed"
              formats={["AUTO", "WEBP", "AVIF"]}
              src="../images/profile-pic.jpg"
              width={50}
              height={50}
              quality={95}
              alt="Profile picture"
            />
            {author?.name && (
              <p>
                Written by <strong>{author.name}</strong>{" "}
                {author?.summary || null}
              </p>
            )}
          </div>
        )
      }}
    />
  )
}

export default Bio
