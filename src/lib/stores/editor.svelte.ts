import type { Abi, Address } from 'abitype';
import type { MessageResult } from '$lib/solc';
import type { DevDoc, UserDoc } from '$lib/types';

export type EditorState = {
	code: string;
	deploymentStatus: string;
	isDeploying: boolean;
	deployerAccount?: Address;
	selectedAccount?: Address;
	availableAccounts: Address[];
	compilationError: string | null;
	compiled: boolean;
	compiledAbi?: Abi;
	compiledBytecode?: string;
	compiledDevDoc?: DevDoc;
	compiledUserDoc?: UserDoc;
};

const CODE_STORAGE_KEY = 'editor-code';
const DEFAULT_CODE = `
//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Use openzeppelin to inherit battle-tested implementations (ERC20, ERC721, etc)
// import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract YourContract {
    // State Variables
    address public immutable owner;
    string public greeting = "Building Unstoppable Apps!!!";
    bool public premium = false;
    uint256 public totalCounter = 0;
    mapping(address => uint) public userGreetingCounter;

    // Events: a way to emit log statements from smart contract that can be listened to by external parties
    event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);

    // Constructor: Called once on contract deployment
    // Check packages/hardhat/deploy/00_deploy_your_contract.ts
    constructor() {
        owner = msg.sender;
    }

    // Modifier: used to define a set of rules that must be met before or after a function is executed
    // Check the withdraw() function
    modifier isOwner() {
        // msg.sender: predefined variable that represents address of the account that called the current function
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    /**
     * Function that allows anyone to change the state variable "greeting" of the contract and increase the counters
     *
     * @param _newGreeting (string memory) - new greeting to save on the contract
     */
    function setGreeting(string memory _newGreeting) public payable {
        // Change state variables
        greeting = _newGreeting;
        totalCounter += 1;
        userGreetingCounter[msg.sender] += 1;

        // msg.value: built-in global variable that represents the amount of ether sent with the transaction
        if (msg.value > 0) {
            premium = true;
        } else {
            premium = false;
        }

        // emit: keyword used to trigger an event
        emit GreetingChange(msg.sender, _newGreeting, msg.value > 0, msg.value);
    }

    /**
     * Function that allows the owner to withdraw all the Ether in the contract
     * The function can only be called by the owner of the contract as defined by the isOwner modifier
     */
    function withdraw() public isOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable {}
}
`.trim();

const defaultState: Omit<EditorState, 'code'> = {
	deploymentStatus: '',
	isDeploying: false,
	availableAccounts: [],
	compilationError: null,
	compiled: false,
	compiledDevDoc: undefined,
	compiledUserDoc: undefined
};

const isBrowser = typeof window !== 'undefined';

function loadInitialState(): EditorState {
	let code = DEFAULT_CODE;

	if (isBrowser) {
		try {
			const savedCode = localStorage.getItem(CODE_STORAGE_KEY);
			if (savedCode) {
				code = savedCode;
			}
		} catch (error) {
			console.error('Failed to load editor code from localStorage:', error);
		}
	}

	return {
		...defaultState,
		code: code
	};
}

let editorState: EditorState = $state(loadInitialState());

function saveCodeToLocalStorage() {
	if (isBrowser) {
		try {
			localStorage.setItem(CODE_STORAGE_KEY, editorState.code);
		} catch (error) {
			console.error('Failed to save editor code to localStorage:', error);
		}
	}
}

export const getEditorState = (): Readonly<EditorState> => editorState;

export const setEditorState = (state: EditorState) => {
	editorState = state;
	saveCodeToLocalStorage();
};

export const updateEditorState = (state: Partial<EditorState>) => {
	editorState = { ...editorState, ...state };
	if (state.code !== undefined) {
		saveCodeToLocalStorage();
	}
};

export const resetEditorState = () => {
	editorState = {
		...defaultState,
		code: DEFAULT_CODE,
		deployerAccount: editorState.deployerAccount
	};
	if (isBrowser) {
		try {
			localStorage.removeItem(CODE_STORAGE_KEY);
		} catch (error) {
			console.error('Failed to remove editor code from localStorage:', error);
		}
	}
};

export function extractContractInfo(sourceCode: string): {
	contractName: string | null;
	solidityVersion: string | null;
} {
	const contractNameMatch = sourceCode.match(/contract\s+(\w+).*\{/);
	const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+([^;]+);/);

	const solidityVersion = pragmaMatch
		? pragmaMatch[1]
				.replace(/\^|>=|<=|>|</, '')
				.trim()
				.split('.')[1]
		: '0.8.24';

	return {
		contractName: contractNameMatch ? contractNameMatch[1] : null,
		solidityVersion: solidityVersion ? `0.${solidityVersion}` : '0.8.24'
	};
}

export async function compileContract(
	compilerWorker: Worker,
	sourceCode: string
): Promise<MessageResult> {
	return new Promise((resolve, reject) => {
		if (!compilerWorker) {
			throw new Error('Compiler worker not initialized');
		}

		const messageId = crypto.randomUUID();

		const handleMessage = (event: MessageEvent) => {
			const data = event.data;

			if (data.result.id === messageId) {
				compilerWorker?.removeEventListener('message', handleMessage);

				if (data.success) {
					resolve(data);
				} else {
					reject(new Error(data.error || 'Unknown compilation error'));
				}
			}
		};

		compilerWorker.addEventListener('message', handleMessage);

		compilerWorker.postMessage({
			code: sourceCode,
			id: messageId
		});
	});
}
