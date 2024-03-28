import { PRIVATE_KEY } from "$env/static/private";
import { useAuth } from "$lib/util/api/index.js";
import jwt from "jsonwebtoken";

export async function POST({ request }) {
	const userKey = `${request.headers.get("x-username")}:${request.headers.get("x-token")}`;
	const user = await useAuth(userKey);
	const token = jwt.sign({ ...user, apiKey: userKey }, Buffer.from(PRIVATE_KEY), {
		algorithm: "RS256",
	});
	return new Response(token, {
		headers: {
			"content-type": "text/html",
		},
	});
}
