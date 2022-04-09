import React, { useEffect, useState } from 'react';

export const loadPages = async (): Promise<Array<String>> => {
  const response = await fetch("api/get-pages");
  await response
  let pages = await response.json();
  if (process.env.NODE_ENV === "production") {
    pages = pages.map(page => page.substr(1)) // Remove forward slash
  }
  return pages;
}

const Test = () => {
  const [pages, setPages] = useState<Array<String>>([])
  useEffect(() => {
    loadPages().then(p => setPages(p))
  }, [])

  const pageLinks = pages.map((item, index) => {
    const title = item;
    const link = window.location.href + item;
    return <div key={index}>
      <a href={link} >{title}</a>
      <br />
    </div >
  })
  return (
    <div>
      {pageLinks}
    </div>
  )
}

export default Test