import { defineConfig } from '@wagmi/cli';
import { hardhat } from "@wagmi/cli/plugins";

export default defineConfig({
  out: "wagmi/generated.ts",
  contracts: [],
  plugins: [
    hardhat({
      artifacts: "artifacts/contracts",
      commands: {
        clean: "yarn hardhat clean",
        build: "yarn hardhat compile",
        rebuild: "yarn hardhat compile",
      },
      project: "./",
    }),
  ],
});