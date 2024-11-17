import fs from "fs"

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"))

/*global console, fetch*/

fetch(
  "https://raw.githubusercontent.com/bot-ts/.github/main/profile/readme.md",
  {
    cache: "reload",
  },
)
  .then((response) => response.text())
  .then((response) => {
    fs.writeFile(
      "readme.md",
      response
        .replace(
          /<div class="title"><\/div>/,
          `<h1> ${packageJson.name} </h1><p> ${packageJson.description} </p>`,
        )
        .replace(/\[(.+?)]\((.+?)\)/, "<a href='$2'>$1</a>"),
      (err) => {
        if (err) {
          console.error("Error writing readme.md:", err)
        } else {
          console.log("readme.md updated successfully.")
        }
      },
    )
  })
  .catch((error) => {
    console.error("Error downloading readme.md:", error)
  })
