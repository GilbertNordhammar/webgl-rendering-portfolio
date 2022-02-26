import glob from "glob";

let getPages;
if (process.env.NODE_ENV === "production") {
  getPages = (req, res) => {
    const cwd = __dirname.substr(0, __dirname.length - "\\api".length)
    glob('*.html', { cwd }, (err, directories) => {
      directories = directories.filter(dir => !["404.html", "500.html", "index.html"].includes(dir))
      directories = directories.map(dir => dir.substring(0, dir.length - ".html".length))
      res.status(200).send(directories)
    })
  }
}
else {
  getPages = (req, res) => {
    const cwd = __dirname.substr(0, __dirname.length - "\\build-dev\\server\\pages\\api".length) + "\\pages"
    glob('**\\', { cwd }, (err, directories) => {
      directories = directories.map(dir => dir.substring(0, dir.length - 1))
      directories = directories.filter(dir => !["api"].includes(dir))
      res.status(200).send(directories)
    })
  }
}

export default getPages;