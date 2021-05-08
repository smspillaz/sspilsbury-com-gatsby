import * as React from "react"
import { Link } from "gatsby"
import { BackgroundAnimation } from "./BackgroundAnimation"

const Layout = ({ location, title, children }) => {
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
    <div className="global-wrapper" data-is-root-path={isRootPath}>
      <header className="global-header">{header}</header>
      <main>{children}</main>
      <footer>
        © {new Date().getFullYear()}, Built with
        {` `}
        <a href="https://www.gatsbyjs.com">Gatsby</a>
      </footer>
    </div>
  )
}

export default Layout
