import * as React from "react"
import { graphql } from "gatsby"
import { MDXRenderer } from "gatsby-plugin-mdx"

import Layout from "../components/Layout"
import Seo from "../components/SEO"

const HirePageIndex = ({ data }) => {
  const post = data.mdx
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const menuLinks = data.site.siteMetadata.menuLinks

  return (
    <Layout title={siteTitle} menuLinks={menuLinks} root>
      <Seo
        title={post.frontmatter.title}
        description={post.frontmatter.description || post.excerpt}
      />
      <article
        className="blog-post"
        itemScope
        itemType="http://schema.org/Article"
      >
        <MDXRenderer>{post.body}</MDXRenderer>
      </article>
    </Layout>
  )
}

export default HirePageIndex

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
    mdx(frontmatter: { name: { eq: "hire" } }) {
      id
      body
      frontmatter {
        title
      }
    }
  }
`
