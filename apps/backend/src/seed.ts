import { insertReport } from "./db";

insertReport(
  "Alice Wang",
  ["Finished the login page UI", "Wrote unit tests for auth service"],
  ["Integrating OAuth2 with Google"],
  [],
  "Alice completed frontend auth work and is now connecting the Google OAuth flow.",
  "Hey, so today I finished up the login page UI and also wrote the unit tests for the auth service. Right now I'm working on integrating OAuth2 with Google. No blockers so far, things are going smoothly.",
);

insertReport(
  "Bob Zhang",
  ["Deployed staging environment", "Fixed the CI pipeline timeout issue"],
  ["Setting up monitoring dashboards in Grafana"],
  ["Waiting on DevOps team for production AWS credentials"],
  "Bob fixed CI and deployed staging, but is blocked on prod credentials from DevOps.",
  "Alright, today I got the staging environment deployed and fixed that annoying CI pipeline timeout we've been dealing with. I'm now setting up the Grafana monitoring dashboards. One blocker though — I'm still waiting on the DevOps team to give me the production AWS credentials.",
);

insertReport(
  "Carol Li",
  ["Completed API documentation for v2 endpoints"],
  ["Refactoring the payment module to support Stripe", "Writing integration tests for checkout flow"],
  ["Stripe sandbox keeps returning 500 errors", "Need design review for the new checkout page"],
  "Carol documented the v2 API and is refactoring payments, but blocked by Stripe sandbox issues and a pending design review.",
  "Hi, so I completed all the API documentation for our v2 endpoints today. I'm currently refactoring the payment module to support Stripe and also writing integration tests for the checkout flow. I've got two blockers — the Stripe sandbox keeps returning 500 errors which is slowing me down, and I still need a design review for the new checkout page before I can proceed with the UI.",
);

console.log("Seeded 3 fake reports.");
