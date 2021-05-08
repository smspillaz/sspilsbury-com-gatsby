import * as React from "react"
import PropTypes from "prop-types"
import { Link, graphql } from "gatsby"
import styled from "styled-components"

import Bio from "../components/Bio"
import Layout from "../components/Layout"
import Seo from "../components/SEO"

const CenteredNav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
`

const MenuUl = styled.ul`
  display: flex;
  flex: 1;
  flex-grow: 0;
  margin: 0;
`

const MenuLi = styled.li`
  list-style-type: none;
  padding: 0rem 1rem;
  margin 0;
`

const Nav = ({ menuLinks }) => (
  <CenteredNav className="menu-nav">
    <MenuUl className="menu-unordered-list">
      {menuLinks
        .filter(l => l.nav)
        .map(link => (
          <MenuLi key={link.name} className="menu-list-item">
            <Link
              style={{
                textDecoration: `none`,
                fontFamily: `Montserrat, system-ui`,
              }}
              to={link.link}
            >
              {link.name}
            </Link>
          </MenuLi>
        ))}
    </MenuUl>
  </CenteredNav>
)

Nav.propTypes = {
  menuLinks: PropTypes.arrayOf(
    PropTypes.shape({
      nav: PropTypes.bool.isRequired,
      link: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
}

const BlogIndex = ({ data, location }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const posts = data.allMarkdownRemark.nodes
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
    <Layout location={location} title={siteTitle}>
      <Seo title="All posts" />
      <Nav menuLinks={menuLinks} />
      <ol style={{ listStyle: `none` }}>
        {posts.map(post => {
          const title = post.frontmatter.title || post.fields.slug

          return (
            <li key={post.fields.slug}>
              <article
                className="post-list-item"
                itemScope
                itemType="http://schema.org/Article"
              >
                <header>
                  <h2>
                    <Link to={post.fields.slug} itemProp="url">
                      <span itemProp="headline">{title}</span>
                    </Link>
                  </h2>
                  <small>{post.frontmatter.date}</small>
                </header>
                <section>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: post.frontmatter.description || post.excerpt,
                    }}
                    itemProp="description"
                  />
                </section>
              </article>
            </li>
          )
        })}
      </ol>
      <Bio />
    </Layout>
  )
}

export default BlogIndex

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
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      nodes {
        excerpt
        fields {
          slug
        }
        frontmatter {
          date(formatString: "MMMM DD, YYYY")
          title
          description
        }
      }
    }
  }
`
