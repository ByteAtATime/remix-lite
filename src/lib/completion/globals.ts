import { languages, type IRange } from 'monaco-editor';

export function getContextualAutoCompleteByGlobalVariable(
	word: string,
	range: IRange
): languages.CompletionItem[] | null {
	if (word === 'block') {
		return getBlockCompletionItems(range);
	}
	if (word === 'string') {
		return getStringCompletionItems(range);
	}
	if (word === 'bytes') {
		return getBytesCompletionItems(range);
	}
	if (word === 'msg') {
		return getMsgCompletionItems(range);
	}
	if (word === 'tx') {
		return getTxCompletionItems(range);
	}
	if (word === 'abi') {
		return getAbiCompletionItems(range);
	}
	if (word === 'sender') {
		return getAddressCompletionItems(range);
	}
	return null;
}

function getStringCompletionItems(range: IRange): languages.CompletionItem[] {
	return [
		{
			detail: 'concatenate an arbitrary number of string values',
			kind: languages.CompletionItemKind.Property,
			insertText: 'concat(${1:string})',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'concat()',
			range
		}
	];
}

function getBytesCompletionItems(range: IRange): languages.CompletionItem[] {
	return [
		{
			detail: 'concatenate an arbitrary number of values',
			kind: languages.CompletionItemKind.Property,
			insertText: 'concat(${1:bytes})',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'concat()',
			range
		}
	];
}

function getBlockCompletionItems(range: IRange): languages.CompletionItem[] {
	return [
		{
			detail: '(address): Current block miner’s address',
			kind: languages.CompletionItemKind.Property,
			insertText: 'coinbase',
			label: 'coinbase',
			range
		},
		{
			detail: '(uint): Current block’s base fee',
			kind: languages.CompletionItemKind.Property,
			insertText: 'basefee',
			label: 'basefee',
			range
		},
		{
			detail: '(uint): Current chain id',
			kind: languages.CompletionItemKind.Property,
			insertText: 'chainid',
			label: 'chainid',
			range
		},
		{
			detail:
				'(bytes32): DEPRECATED In 0.4.22 use blockhash(uint) instead. Hash of the given block - only works for 256 most recent blocks excluding current',
			insertText: 'blockhash(${1:blockNumber});',
			kind: languages.CompletionItemKind.Method,
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'blockhash',
			range
		},
		{
			detail: '(uint): current block difficulty',
			kind: languages.CompletionItemKind.Property,
			label: 'difficulty',
			insertText: 'difficulty',
			range
		},
		{
			detail: '(uint): current block gaslimit',
			kind: languages.CompletionItemKind.Property,
			label: 'gaslimit',
			insertText: 'gaslimit',
			range
		},
		{
			detail: '(uint): current block number',
			kind: languages.CompletionItemKind.Property,
			label: 'number',
			insertText: 'number',
			range
		},
		{
			detail: '(uint): current block timestamp as seconds since unix epoch',
			kind: languages.CompletionItemKind.Property,
			label: 'timestamp',
			insertText: 'timestamp',
			range
		}
	];
}

function getTxCompletionItems(range: IRange): languages.CompletionItem[] {
	return [
		{
			detail: '(uint): gas price of the transaction',
			kind: languages.CompletionItemKind.Property,
			insertText: 'gas',
			label: 'gas',
			range
		},
		{
			detail: '(address): sender of the transaction (full call chain)',
			kind: languages.CompletionItemKind.Property,
			insertText: 'origin',
			label: 'origin',
			range
		}
	];
}

function getAbiCompletionItems(range: IRange): languages.CompletionItem[] {
	return [
		{
			detail: 'encode(..) returns (bytes): ABI-encodes the given arguments',
			insertText: 'encode(${1:arg});',
			kind: languages.CompletionItemKind.Method,
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'encode',
			range
		},
		{
			detail:
				'encodeCall(function functionPointer, (...)) returns (bytes memory) ABI-encodes a call to functionPointer with the arguments found in the tuple',
			insertText: 'encode(${1:arg});',
			kind: languages.CompletionItemKind.Method,
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'encodecall',
			range
		},
		{
			detail: 'encodePacked(..) returns (bytes): Performs packed encoding of the given arguments',
			insertText: 'encodePacked(${1:arg});',
			kind: languages.CompletionItemKind.Method,
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'encodePacked',
			range
		},
		{
			detail:
				'encodeWithSelector(bytes4,...) returns (bytes): ABI-encodes the given arguments starting from the second and prepends the given four-byte selector',
			insertText: 'encodeWithSelector(${1:bytes4}, ${2:arg});',
			kind: languages.CompletionItemKind.Method,
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'encodeWithSelector',
			range
		},
		{
			detail:
				'encodeWithSignature(string,...) returns (bytes): Equivalent to abi.encodeWithSelector(bytes4(keccak256(signature), ...)`',
			insertText: 'encodeWithSignature(${1:signatureString}, ${2:arg});',
			kind: languages.CompletionItemKind.Method,
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'encodeWithSignature',
			range
		},
		{
			label: 'decode',
			kind: languages.CompletionItemKind.Method,
			insertText: 'decode(${1:arg}, ${2:arg});',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			detail:
				'decode(bytes encodedData, (...)) returns (...): ABI-decodes the given arguments from the given encodedData',
			range
		}
	];
}

function getMsgCompletionItems(range: IRange): languages.CompletionItem[] {
	return [
		{
			detail: '(bytes): complete calldata',
			kind: languages.CompletionItemKind.Property,
			insertText: 'data',
			label: 'data',
			range
		},
		{
			detail: '(uint): remaining gas DEPRECATED in 0.4.21 use gasleft()',
			kind: languages.CompletionItemKind.Property,
			insertText: 'gas',
			label: 'gas',
			range
		},
		{
			detail: '(address): sender of the message (current call)',
			kind: languages.CompletionItemKind.Property,
			insertText: 'sender',
			label: 'sender',
			range
		},
		{
			detail: '(bytes4): first four bytes of the calldata (i.e. function identifier)',
			kind: languages.CompletionItemKind.Property,
			insertText: 'sig',
			label: 'sig',
			range
		},
		{
			detail: '(uint): number of wei sent with the message',
			kind: languages.CompletionItemKind.Property,
			insertText: 'value',
			label: 'value',
			range
		}
	];
}

export function getAddressCompletionItems(range: IRange): languages.CompletionItem[] {
	return [
		{
			detail: '(uint256): balance of the Address in Wei',
			kind: languages.CompletionItemKind.Method,
			insertText: 'balance;',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'balance',
			range
		},
		{
			detail: '(bytes memory): code at the Address (can be empty)',
			kind: languages.CompletionItemKind.Method,
			insertText: 'code;',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'code',
			range
		},
		{
			detail: '(bytes32): the codehash of the Address',
			kind: languages.CompletionItemKind.Method,
			insertText: 'codehash;',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'codehash',
			range
		},
		{
			detail:
				'(uint256 amount) returns (bool): send given amount of Wei to Address, returns false on failure',
			kind: languages.CompletionItemKind.Method,
			insertText: 'send(${1:value});',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'send()',
			range
		},
		{
			detail: '(uint256 amount): send given amount of Wei to Address, throws on failure',
			kind: languages.CompletionItemKind.Method,
			insertText: 'transfer(${1:value});',
			insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
			label: 'transfer()',
			range
		}
	];
}
