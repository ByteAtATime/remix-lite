import type { Abi, Address } from 'abitype';
import type { MessageResult } from '$lib/solc';
import type { DevDoc, UserDoc } from '$lib/types';

export type EditorState = {
	code: string;
	deploymentStatus: string;
	deployerAccount?: Address;
	compilationError: string | null;
	compiled: boolean;
	compiledAbi?: Abi;
	compiledBytecode?: string;
	compiledDevDoc?: DevDoc;
	compiledUserDoc?: UserDoc;
};

const STORAGE_KEY = 'editor-state';
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

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

function loadFromLocalStorage(): EditorState {
	if (isBrowser) {
		try {
			const savedState = localStorage.getItem(STORAGE_KEY);
			if (savedState) {
				const parsed = JSON.parse(savedState);
				// Validate the parsed state has at least a code property
				if (parsed && typeof parsed.code === 'string') {
					return parsed;
				}
			}
		} catch (error) {
			console.error('Failed to load editor state from localStorage:', error);
		}
	}

	// Return default state if nothing is stored or we're not in a browser
	return {
		code: DEFAULT_CODE,
		deploymentStatus: '',
		compilationError: null,
		compiled: false,
		compiledDevDoc: undefined,
		compiledUserDoc: undefined
	};
}

let editorState: EditorState = $state(loadFromLocalStorage());

function saveToLocalStorage() {
	if (isBrowser) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(editorState));
		} catch (error) {
			console.error('Failed to save editor state to localStorage:', error);
		}
	}
}

export const getEditorState = (): Readonly<EditorState> => editorState;

export const setEditorState = (state: EditorState) => {
	editorState = state;
	saveToLocalStorage();
};

export const updateEditorState = (state: Partial<EditorState>) => {
	editorState = { ...editorState, ...state };
	saveToLocalStorage();
};

export const resetEditorState = () => {
	editorState = {
		code: DEFAULT_CODE,
		deploymentStatus: '',
		compilationError: null,
		compiled: false,
		compiledDevDoc: undefined,
		compiledUserDoc: undefined
	};
	saveToLocalStorage();
};

export function extractContractInfo(sourceCode: string): {
	contractName: string | null;
	solidityVersion: string | null;
} {
	const contractNameMatch = sourceCode.match(/contract\s+(\w+)\s*\{/);
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
