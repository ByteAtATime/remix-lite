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
import { getContextualAutoCompleteByGlobalVariable } from './globals';

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
			const suggestions = getContextualAutoCompleteByGlobalVariable(lastNode.name, range);
			if (suggestions) {
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
