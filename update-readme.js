import axios from "axios"
import fs from "fs"

axios
  .get(
    "https://raw.githubusercontent.com/bot-ts/.github/main/profile/readme.md",
  )
  .then((response) => {
    fs.writeFile("readme.md", response.data, (err) => {
      if (err) {
        console.error("Error writing readme.md:", err)
      } else {
        console.log("readme.md updated successfully.")
      }
    })
  })
  .catch((error) => {
    console.error("Error downloading readme.md:", error)
  })
