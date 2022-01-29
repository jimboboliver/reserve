import app from "./index.js";
import serverlessExpress from "@vendia/serverless-express";

const _handler = serverlessExpress({ app });

export const handler = (event, context) => {
  console.log(event);
  console.log(context);
  const response = _handler(event, context);
  console.log(response);
  return response;
};
