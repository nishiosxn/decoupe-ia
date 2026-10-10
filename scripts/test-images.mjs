// Public photographic test inputs are downloaded locally and never bundled with the app.
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("work/fixtures", { recursive: true });
const cases = {
  "person.jpg":
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=90",
  "watch.jpg":
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=90",
  "shoe.jpg":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=90",
  "car-1.jpg":
    "https://raw.githubusercontent.com/danielgatis/rembg/main/tests/fixtures/car-1.jpg",
  "plants-1.jpg":
    "https://raw.githubusercontent.com/danielgatis/rembg/main/tests/fixtures/plants-1.jpg",
};
await Promise.all(
  Object.entries(cases).map(async ([name, url]) => {
    const response = await fetch(url);
    if (!response.ok) throw Error(name + ": " + response.status);
    await writeFile(
      "work/fixtures/" + name,
      new Uint8Array(await response.arrayBuffer()),
    );
    console.log(name);
  }),
);
