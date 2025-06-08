# Remix Lite

**A lightweight, zero-setup, in-browser Solidity IDE powered by [TEVM](https://tevm.sh/).**

Remix Lite provides a fast, modern, and powerful environment for developing, testing, and interacting with Solidity smart contracts directly in your browser. No downloads, no dependencies, no configuration required. Just open the page and start coding.

**[Try it live!](https://remix.byteatatime.dev)**

## ✨ Key Features

- **⚡️ Zero-Setup Environment**: Runs entirely in your browser. No need to install Node.js, Docker, or any other dependencies.
- **🚀 In-Browser EVM**: Powered by **TEVM**, providing a high-speed, in-memory Ethereum Virtual Machine for instant transaction execution.
- **✍️ Smart Code Editor**: A rich editing experience with [Monaco Editor](https://microsoft.github.io/monaco-editor/), featuring:
  - Solidity Syntax Highlighting.
  - Intelligent autocompletion for basic Solidity keywords.
- **-click Compilation & Deployment**: The Solidity compiler runs in a web worker, allowing for seamless compilation and one-click deployment to the local TEVM instance.
- **🤖 Auto-Generated UI**: Once your contract is deployed, Remix Lite automatically generates a clean, user-friendly interface to read state variables and execute functions.
- **🛠️ Advanced Mode**: Unlock powerful testing utilities:
  - **Account Selector**: Effortlessly switch between multiple pre-funded accounts.
  - **Token Manager**: A "cheat code" for testing ERC20 interactions. Validate token addresses, and _set_ token balances for any address to simulate airdrops or test scenarios.
- **🔗 Sharable Snippets**: Share your code with anyone by generating a unique URL that contains your entire contract.

## 🚀 How to Use

1.  **Open the App**: Navigate to the [live URL](https://remix.byteatatime.dev).
2.  **Write Code**: The editor is pre-filled with an example `YourContract.sol`. You can modify it or paste your own code.
3.  **Deploy**: Click the **Deploy** button. Your contract is instantly compiled and deployed to the in-browser TEVM.
4.  **Interact**: The right-hand panel will automatically populate with your contract's public variables and functions.
    - Call `view` and `pure` functions to read data.
    - Execute `nonpayable` and `payable` functions to write data to the state.
    - View detailed transaction receipts, including gas usage and emitted events.
5.  **Go Advanced**: Click the **Advanced Mode** toggle to access the Account Selector and Token Manager for more complex testing scenarios.

## 👨‍💻 Development

Want to run Remix Lite locally? It's easy!

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ByteAtATime/remix-lite.git
    cd remix-lite
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Start the development server:**

    ```bash
    pnpm dev
    ```

4.  Open your browser to `http://localhost:5173` and start building!

## ❤️ Contributing

Contributions are welcome! If you have a feature request, bug report, or want to improve the codebase, please open an issue or submit a pull request.
