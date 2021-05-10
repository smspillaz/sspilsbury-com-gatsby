import * as React from "react"
import { graphql } from "gatsby"

import Bio from "../components/Bio"
import Layout from "../components/Layout"
import Seo from "../components/SEO"
import { ProjectPreview } from "../components/ProjectPreview"
import { ProjectPreviewImageCarousel } from "../components/ProjectPreviewImageCarousel"
import { LayoutTypes } from "../components/ResponsiveOrderedLayoutChild"

const ProjectIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const posts = data.allMdx.nodes
  const menuLinks = data.site.siteMetadata.menuLinks

  if (posts.length === 0) {
    return (
      <Layout location={location} title={siteTitle}>
        <Seo title="All posts" />
        <Bio />
        <p>
          No blog posts found. Add markdown posts to "content/blog" (or the
          directory you specified for the "gatsby-source-filesystem" plugin in
          gatsby-config.js).
        </p>
      </Layout>
    )
  }

  return (
    <Layout location={location} title={siteTitle} menuLinks={menuLinks}>
      <Seo title="All posts" />
      <ol style={{ listStyle: `none` }}>
        {posts.map((post, i) => {
          const title = post.frontmatter.title || post.fields.slug

          return (
            <li key={post.fields.slug}>
              <ProjectPreview
                header={title}
                subtitle={post.frontmatter.subtitle || null}
                client={post.frontmatter.client}
                description={post.frontmatter.short}
                url={post.frontmatter.url}
                layout={i % 2 === 0 ? LayoutTypes.LEFT : LayoutTypes.RIGHT}
                renderContractedPreview={() => (
                  <ProjectPreviewImageCarousel
                    images={post.frontmatter.images}
                    imageStyleProps={post.frontmatter.imageStyleProps || {}}
                  />
                )}
              />
            </li>
          )
        })}
      </ol>
      <Bio />
    </Layout>
  )
}

export default ProjectIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
        menuLinks {
          name
          link
          nav
        }
      }
    }
    allMdx(
      sort: { fields: [frontmatter___title], order: DESC }
      filter: { frontmatter: { project: { eq: true } } }
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          featured
          title
          subtitle
          url
          short
          images
        }
      }
    }
  }
`
