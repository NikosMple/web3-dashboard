module.exports = {
  web3Auth: {
    input: "http://localhost:4000/docs-json",
    output: {
      target: "./src/api/generated.ts",
      client: "react-query",
      prettier: true,
      override: {
        mutator: {
          path: "./src/api/axiosInstance.ts",
          name: "customInstance",
        },
      },
    },
  },
};
