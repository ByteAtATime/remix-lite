import type { SolcOutput } from '@tevm/solc';

type MessageResult =
    | {
        success: true;
        result: {
            id: string;
            data: SolcOutput;
        };
    }
    | {
        success: false;
        result: {
            id: string;
        };
        error: unknown;
    };

declare const Module: {
    cwrap: (name: string, returnType: string, args: string[]) => (...args: unknown[]) => string;
};

const COMPILER_URL = 'https://binaries.soliditylang.org/bin/soljson-v0.8.29+commit.ab55807c.js';

let compilerInitializationPromise: Promise<void>;

async function initializeRemoteCompiler(): Promise<void> {
    if (typeof Module !== 'undefined' && typeof Module.cwrap === 'function') {
        console.log('Solidity compiler already available.');
        return;
    }

    try {
        console.log(`Fetching Solidity compiler from ${COMPILER_URL}...`);
        const response = await fetch(COMPILER_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch compiler from ${COMPILER_URL}: ${response.status} ${response.statusText}`);
        }
        const scriptText = await response.text();
        console.log('Compiler script fetched. Executing in worker global scope...');

        self.eval(scriptText);


        if (typeof Module === 'undefined' || typeof Module.cwrap !== 'function') {
            throw new Error('Compiler script executed, but `Module.cwrap` is not defined. The compiler script might have changed its initialization behavior or failed to initialize properly.');
        }
        console.log('Solidity compiler loaded and initialized successfully in module worker.');
    } catch (error) {
        console.error('Failed to load or initialize Solidity compiler in module worker:', error);
        throw error;
    }
}

function ensureCompilerLoaded(): Promise<void> {
    if (!compilerInitializationPromise) {
        compilerInitializationPromise = initializeRemoteCompiler();
    }
    return compilerInitializationPromise;
}

ensureCompilerLoaded().catch(error => {
    console.warn("Initial attempt to load compiler failed. Worker may not function correctly until the issue is resolved. Error:", error.message);
});

self.onmessage = async (e: MessageEvent<{ code: string; id: string }>) => {
    const { code, id } = e.data;

    try {
        await ensureCompilerLoaded();

        const compile = Module.cwrap(
            'solidity_compile',
            'string',
            ['string', 'number']
        );

        const compilerInput = JSON.stringify({
            language: 'Solidity',
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode.object', 'devdoc', 'userdoc']
                    }
                }
            },
            sources: {
                'contract.sol': {
                    content: code
                }
            }
        });

        const outputJson = compile(compilerInput);

        if (!outputJson && typeof outputJson !== 'string') {
            throw new Error('Compiler returned invalid or empty output.');
        }

        const solcOutput = JSON.parse(outputJson) as SolcOutput;

        if (solcOutput.errors) {
            const hasCompilationErrors = solcOutput.errors.some(error => error.severity === 'error');
            if (hasCompilationErrors) {
                console.warn(`[Worker] Solidity compilation for id '${id}' completed with errors:`, solcOutput.errors);
            }
        }

        const result = {
            data: solcOutput,
            id
        };

        self.postMessage({ success: true, result } satisfies MessageResult);

    } catch (error) {
        console.error(`[Worker] Critical error during compilation process for id '${id}':`, error);
        self.postMessage({
            success: false,
            result: { id },
            error: error instanceof Error ? error.message : String(error)
        } satisfies MessageResult);
    }
};
