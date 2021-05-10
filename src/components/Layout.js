import * as React from "react"
import PropTypes from "prop-types"
import styled from "styled-components"
import { MDXProvider } from "@mdx-js/react"
import { Link } from "gatsby"
import { BackgroundAnimation } from "./BackgroundAnimation"
import { PageBio } from "./PageBio"

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
  padding: 0rem 0.5rem;
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

const components = {
  bio: PageBio,
  link: Link,
}

const Layout = ({ location, title, children, menuLinks }) => {
  const rootPath = `${__PATH_PREFIX__}/`
  const isRootPath = location.pathname === rootPath
  let header

  if (isRootPath) {
    header = (
      <div>
        <h1 className="main-heading" style={{ textAlign: "center" }}>
          <Link to="/">{title}</Link>
        </h1>
        <BackgroundAnimation
          style={{
            margin: "-80px 0 -80px 0",
            zIndex: 0,
            width: "100%",
            height: "300px",
          }}
        ></BackgroundAnimation>
        <Nav menuLinks={menuLinks} />
      </div>
    )
  } else {
    header = (
      <Link className="header-link-home" to="/">
        {title}
      </Link>
    )
  }

  return (
    <MDXProvider components={components}>
      <div className="global-wrapper" data-is-root-path={isRootPath}>
        <header className="global-header">{header}</header>
        <main>{children}</main>
        <footer>
          © {new Date().getFullYear()}, Built with
          {` `}
          <a href="https://www.gatsbyjs.com">Gatsby</a>
        </footer>
      </div>
    </MDXProvider>
  )
}

export default Layout
