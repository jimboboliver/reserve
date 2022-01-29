import { listen } from "./index.js";
const port = process.env.PORT || 3000;
listen(port, () => console.log(`Server is listening on port ${port}.`));
