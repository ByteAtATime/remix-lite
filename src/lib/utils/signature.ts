import type { AbiFunction, AbiParameter } from 'abitype';

const flattenTypes = (includeTuple: boolean, params: readonly AbiParameter[] = []): string[] =>
	params.map((param) => {
		if ('components' in param) {
			const arraySuffixMatch = param.type.match(/(\[.*\])$/);
			const suffix = arraySuffixMatch?.[1] ?? '';
			const nestedTypes = flattenTypes(includeTuple, param.components);
			const joinedNested = nestedTypes.join(',');
			const tupleKeyword = includeTuple ? 'tuple' : '';
			return `${tupleKeyword}(${joinedNested})${suffix}`;
		}
		return param.type;
	});

export const getAbiItemSignature = (json: AbiFunction): string => {
	if (json?.name?.includes('(')) {
		return json.name;
	}

	const name = json?.name ?? '';
	const paramsString = flattenTypes(false, json?.inputs ?? []).join(',');

	return `${name}(${paramsString})`;
};
