import { initClient } from "./client";
import { initServer } from "./server";

if (typeof module !== "undefined") {
  initServer();
} else {
  initClient();
}
