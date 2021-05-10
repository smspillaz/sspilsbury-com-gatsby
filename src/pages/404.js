import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/Layout"
import Seo from "../components/SEO"

const NotFoundPage = ({ data }) => {
  const siteTitle = data.site.siteMetadata.title
  const menuLinks = data.site.siteMetadata.menuLinks

  return (
    <Layout menuLinks={menuLinks} title={siteTitle} root>
      <Seo title="404: Not Found" />
      <h1>404: Not Found</h1>
      <p>You just hit a route that doesn&#39;t exist... the sadness.</p>
    </Layout>
  )
}

export default NotFoundPage

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
  }
`
