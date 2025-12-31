export type UrlParams = {
	code?: string;
	url?: string;
	gist?: string;
};

export function parseUrlParams(hash: string): UrlParams {
	const result: UrlParams = {};

	if (!hash || hash.length <= 1) {
		return result;
	}

	const hashContent = hash.startsWith('#') ? hash.slice(1) : hash;
	const params = new URLSearchParams(hashContent);

	const code = params.get('code');
	if (code) {
		try {
			result.code = decodeURIComponent(atob(code));
		} catch {
			console.error('Failed to decode base64 code from URL');
		}
	}

	const url = params.get('url');
	if (url) {
		result.url = url;
	}

	const gist = params.get('gist');
	if (gist) {
		result.gist = gist;
	}

	return result;
}

export async function fetchFromUrl(url: string): Promise<string> {
	const githubMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);

	if (githubMatch) {
		const [, owner, repo, branch, path] = githubMatch;
		const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
		const response = await fetch(rawUrl);
		if (!response.ok) {
			throw new Error(`Failed to fetch from GitHub: ${response.status} ${response.statusText}`);
		}
		return response.text();
	}

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
	}
	return response.text();
}

export async function fetchFromGist(
	gistId: string
): Promise<{ filename: string; content: string }[]> {
	const response = await fetch(`https://api.github.com/gists/${gistId}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch gist: ${response.status} ${response.statusText}`);
	}

	const gist = await response.json();
	const files: { filename: string; content: string }[] = [];

	for (const [filename, file] of Object.entries(gist.files)) {
		const fileData = file as { content: string };
		if (filename.endsWith('.sol')) {
			files.push({ filename, content: fileData.content });
		}
	}

	if (files.length === 0) {
		throw new Error('No Solidity files found in gist');
	}

	return files;
}
