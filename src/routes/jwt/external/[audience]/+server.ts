import { PRIVATE_KEY } from "$env/static/private";
import { userRepo } from "$lib/server/repo/index.js";
import { getJwtData } from "$lib/server/util/index.js";
import { useAuth } from "$lib/util/api/index.js";
import type { IJwtData } from "$types/auth.js";
import jwt from "jsonwebtoken";

export async function POST({ request }) {
	const jwtData = await getJwtData(request.headers.get("authorization")?.split(" ")[1] || "");
	const user = await userRepo.findOne({
		where: {
			apiKey: jwtData.apiKey,
		},
	});
	const token = jwt.sign({ ...user }, Buffer.from(PRIVATE_KEY), {
		algorithm: "RS256",
	});
	return new Response(token, {
		status: 200,
		headers: {
			"content-type": "text/html",
		},
	});
}
