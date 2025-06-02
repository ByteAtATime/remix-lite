import {
	type CancellationToken,
	type editor,
	type IRange,
	languages,
	type Position
} from 'monaco-editor';
import { parse, visit } from '@solidity-parser/parser';
import type {
	Identifier,
	MemberAccess,
	SourceUnit
} from '@solidity-parser/parser/dist/src/ast-types';

export function getMsgCompletionItems(range: IRange): languages.CompletionItem[] {
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
			detail: '(bytes4): first four bytes of the calldata (i.e. export function identifier)',
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

export class RemixCompletionProvider implements languages.CompletionItemProvider {
	public readonly triggerCharacters =
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.\\@('.split('');

	async provideCompletionItems(
		model: editor.ITextModel,
		position: Position,
		_context: languages.CompletionContext,
		_token: CancellationToken
	): Promise<Awaited<languages.ProviderResult<languages.CompletionList>>> {
		const word = model.getWordUntilPosition(position);
		const range = {
			startLineNumber: position.lineNumber,
			endLineNumber: position.lineNumber,
			startColumn: word.startColumn,
			endColumn: word.endColumn
		};

		const line = model.getLineContent(position.lineNumber);
		const lineTextBeforeCursor = line.substring(0, position.column - 1);

		const lastNode = await this.getLastNodeInExpression(lineTextBeforeCursor);

		if (lastNode && 'name' in lastNode) {
			if (lastNode.name === 'msg') {
				const suggestions = getMsgCompletionItems(range);
				return {
					suggestions: suggestions
				};
			}
		}

		return {
			suggestions: []
		};
	}

	private async getLastNodeInExpression(lineTextBeforeCursor: string) {
		const wrapLineInFunction = async (text: string) => {
			return `function() {
                ${text}
            }`;
		};

		let lastNodeInExpression;

		const linesToCheck = [
			lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode;',
			lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode;}',
			lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode);',
			await wrapLineInFunction(
				lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode;'
			),
			await wrapLineInFunction(
				lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode;}'
			),
			await wrapLineInFunction(
				lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode;)'
			),
			await wrapLineInFunction(
				lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode)'
			),
			await wrapLineInFunction(
				lineTextBeforeCursor.substring(0, lineTextBeforeCursor.lastIndexOf('.')) + '.lastnode);'
			)
		];

		for (const line of linesToCheck) {
			try {
				const ast = parse(line);
				const lastNode = this.getLastNodeInLine(ast);
				if (lastNode) {
					lastNodeInExpression = lastNode;
					break;
				}
			} catch {
				// empty
			}
		}
		return lastNodeInExpression;
	}

	private async getLastNodeInLine(ast: SourceUnit) {
		let lastNode: MemberAccess | Identifier | undefined;
		const checkLastNode = (node: MemberAccess | Identifier) => {
			if (lastNode && lastNode.range && lastNode.range[1]) {
				if (node.range && lastNode.range && node.range[1] > lastNode.range[1]) {
					lastNode = node;
				}
			} else {
				lastNode = node;
			}
		};

		visit(ast, {
			MemberAccess: function (node) {
				checkLastNode(node);
			},
			Identifier: function (node) {
				checkLastNode(node);
			}
		});
		if (lastNode && 'expression' in lastNode) {
			return lastNode.expression;
		}
		return lastNode;
	}
}
