// SVG string → a React component (source text), for the CLI and the MCP server.
const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** JSX attributes: stroke-width → strokeWidth, class → className; aria-* and data-* stay. */
export function svgToJsx(svg) {
  return svg
    .replace(/\s([a-z]+(?:-[a-z]+)+)=/g, (m, k) => (/^(aria|data)-/.test(k) ? m : ` ${camel(k)}=`))
    .replace(/\sclass=/g, ' className=')
    .replace(/\saria-hidden="true"/, ' aria-hidden="true" {...props}')
    .replace(/\srole="img"/, ' role="img" {...props}');
}

/** export function UsersAddIcon(props) { return (<svg …/>); } */
export function jsxComponent(name, svg) {
  const comp = name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase()) + 'Icon';
  return `export function ${comp}(props) {\n  return (\n    ${svgToJsx(svg)}\n  );\n}\n`;
}
