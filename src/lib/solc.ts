import type { SolcOutput } from '@tevm/solc';

export type MessageResult =
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

type ContractSource = {
	content: string;
};

type ContractSources = Record<string, ContractSource>;

type CompilerInput = {
	language: string;
	sources: ContractSources;
	settings: {
		outputSelection: Record<string, Record<string, string[]>>;
	};
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
			throw new Error(
				`Failed to fetch compiler from ${COMPILER_URL}: ${response.status} ${response.statusText}`
			);
		}
		const scriptText = await response.text();
		console.log('Compiler script fetched. Executing in worker global scope...');

		self.eval(scriptText);

		if (typeof Module === 'undefined' || typeof Module.cwrap !== 'function') {
			throw new Error(
				'Compiler script executed, but `Module.cwrap` is not defined. The compiler script might have changed its initialization behavior or failed to initialize properly.'
			);
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

ensureCompilerLoaded().catch((error) => {
	console.warn(
		'Initial attempt to load compiler failed. Worker may not function correctly until the issue is resolved. Error:',
		error.message
	);
});

const openzeppelinContracts = import.meta.glob('/node_modules/@openzeppelin/contracts/**/*.sol', {
	query: '?raw',
	import: 'default'
});

function extractImports(source: string): string[] {
	const imports: string[] = [];

	const importRegex = /import.+?"(.+)"/g;

	let match;
	console.log(source);
	while ((match = importRegex.exec(source)) !== null) {
		imports.push(match[1]);
	}

	return imports;
}

function buildFullPath(parentPath: string, importPath: string): string {
	if (importPath.startsWith('@openzeppelin/')) {
		return `/node_modules/${importPath}`;
	}

	let currentDir = parentPath.substring(0, parentPath.lastIndexOf('/'));

	if (importPath.startsWith('./')) {
		return `${currentDir}/${importPath.substring(2)}`;
	}

	while (importPath.startsWith('../')) {
		currentDir = currentDir.substring(0, currentDir.lastIndexOf('/'));
		importPath = importPath.substring(3);
	}

	return `${currentDir}/${importPath}`;
}

async function resolveImports(
	path: string,
	content: string,
	sources: ContractSources,
	externalSources: Record<string, () => Promise<string>>
): Promise<void> {
	sources[path] = { content };

	const imports = extractImports(content);

	for (const importPath of imports) {
		if (sources[importPath]) continue;

		let fullPath: string;
		let actualImportPath = importPath;

		if (importPath === './IERC20.sol') {
			actualImportPath = 'IERC20.sol';
			fullPath = `/node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol`;
		} else if (
			path.startsWith('@openzeppelin/') &&
			(importPath.startsWith('./') || importPath.startsWith('../'))
		) {
			// relative imports in openzeppelin contracts
			const pathDir = path.substring(0, path.lastIndexOf('/'));

			let relativePath = importPath;
			let baseDir = pathDir;

			if (relativePath.startsWith('./')) {
				relativePath = relativePath.substring(2);
			} else {
				// handle "../"
				while (relativePath.startsWith('../')) {
					baseDir = baseDir.substring(0, baseDir.lastIndexOf('/'));
					relativePath = relativePath.substring(3);
				}
			}

			actualImportPath = `${baseDir}/${relativePath}`;
			fullPath = `/node_modules/${actualImportPath}`;
		} else {
			fullPath = buildFullPath(path, importPath);
			actualImportPath = importPath;
		}

		if (sources[actualImportPath]) continue;

		let importContent: string;
		let contentPath: string;

		if (actualImportPath.startsWith('@openzeppelin/')) {
			contentPath = `/node_modules/${actualImportPath}`;
			const contractLoader = externalSources[contentPath];
			if (contractLoader) {
				importContent = await contractLoader();
				sources[actualImportPath] = { content: importContent };
				await resolveImports(actualImportPath, importContent, sources, externalSources);
			} else {
				console.warn(`Cannot resolve OpenZeppelin import: ${actualImportPath}`);
				continue;
			}
		} else if (fullPath.includes('/node_modules/@openzeppelin/contracts/')) {
			const contractLoader = externalSources[fullPath];
			if (contractLoader) {
				importContent = await contractLoader();
				sources[actualImportPath] = { content: importContent };
				await resolveImports(actualImportPath, importContent, sources, externalSources);
			} else {
				console.warn(`Cannot resolve OpenZeppelin import: ${fullPath}`);
				continue;
			}
		} else {
			console.warn(`Cannot resolve import: ${actualImportPath}`);
			continue;
		}
	}
}

self.onmessage = async (e: MessageEvent<{ code: string; id: string; fileName?: string }>) => {
	const { code, id, fileName = 'contract.sol' } = e.data;

	try {
		await ensureCompilerLoaded();

		const compile = Module.cwrap('solidity_compile', 'string', ['string', 'number']);

		const sources: ContractSources = {};
		await resolveImports(fileName, code, sources, openzeppelinContracts);
		console.log(sources);

		const compilerInput: CompilerInput = {
			language: 'Solidity',
			settings: {
				outputSelection: {
					'*': {
						'*': ['abi', 'evm.bytecode.object', 'devdoc', 'userdoc']
					}
				}
			},
			sources
		};

		const outputJson = compile(JSON.stringify(compilerInput));

		if (!outputJson && typeof outputJson !== 'string') {
			throw new Error('Compiler returned invalid or empty output.');
		}

		const solcOutput = JSON.parse(outputJson) as SolcOutput;

		if (solcOutput.errors) {
			const hasCompilationErrors = solcOutput.errors.some((error) => error.severity === 'error');
			if (hasCompilationErrors) {
				console.warn(
					`[Worker] Solidity compilation for id '${id}' completed with errors:`,
					solcOutput.errors
				);
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
