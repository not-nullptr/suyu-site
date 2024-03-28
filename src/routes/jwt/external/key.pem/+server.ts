import { PUB_KEY } from "$env/static/private";

export function GET({ request }) {
	return new Response(PUB_KEY, {
		headers: {
			"content-type": "text/plain",
		},
	});
}

export function POST({ request }) {
	return new Response();
}
