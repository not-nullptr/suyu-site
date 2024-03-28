import { userRepo } from "$lib/server/repo";
import type { SuyuUser } from "$lib/server/schema";
import { PUB_KEY } from "$env/static/private";
import type { IJwtData } from "$types/auth";
import cookie from "cookie";
import jwt from "jsonwebtoken";

export async function useAuth(
	request: Request | string,
	eager?: boolean,
): Promise<SuyuUser | null> {
	const cookies = cookie.parse(
		typeof request !== "string" ? request.headers.get("cookie") || "" : "",
	);
	const apiKey = typeof request === "string" ? request : cookies.token;
	if (!apiKey) {
		return null;
	}
	if (apiKey.startsWith("Bearer ")) {
		const token = apiKey.replace("Bearer ", "");
		const decoded: IJwtData = jwt.verify(token, Buffer.from(PUB_KEY), {
			algorithms: ["RS256"],
		}) as IJwtData;
		let user = await userRepo.findOne({
			where: {
				apiKey: decoded.apiKey,
			},
			loadEagerRelations: eager || false,
			relations: eager ? ["sentFriendRequests", "receivedFriendRequests"] : [],
		});
		if (!user) {
			user = await userRepo.findOne({
				where: {
					id: decoded.id,
				},
				loadEagerRelations: eager || false,
				relations: eager ? ["sentFriendRequests", "receivedFriendRequests"] : [],
			});
		}
		return user;
	}
	const user = await userRepo.findOne({
		where: {
			apiKey,
		},
		loadEagerRelations: eager || false,
		relations: eager ? ["sentFriendRequests", "receivedFriendRequests"] : [],
	});
	return user;
}

export async function useModeratorAuth(request: Request | string): Promise<{
	user: SuyuUser;
	isModerator: boolean;
} | null> {
	const user = await useAuth(request);
	if (!user) {
		return null;
	}
	return {
		user,
		isModerator: user.roles.includes("moderator"),
	};
}
