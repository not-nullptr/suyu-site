import { Room, RoomManager } from "$lib/server/class/Room";
import { userRepo } from "$lib/server/repo/index.js";
import { SuyuUser } from "$lib/server/schema";
import { json } from "$lib/server/util";
import { useAuth } from "$lib/util/api/index.js";
import type { IJwtData } from "$types/auth.js";
import type { IRoom, LobbyResponse } from "$types/rooms";
import jwt from "jsonwebtoken";

export async function GET({ request }) {
	return json<LobbyResponse>({
		rooms: RoomManager.getRooms().map((r) => r.toJSON()),
	});
}

/* credit to janeberru for showing the shape of this data */
export async function POST({ request, getClientAddress }) {
	// TODO: per-ip room limit
	const body: IRoom = await request.json();
	/* description may contain "### END DESCRIPTION ###" on its own line. if it does, get all lines after that */
	const parsedDescription = body.description?.split("### END DESCRIPTION ###");
	const description = parsedDescription?.slice(1)?.join("### END DESCRIPTION ###") || "";
	const opts: { [key: string]: string } = {};
	description?.split("\n").forEach((line) => {
		const [key, ...values] = line.split("=");
		const value = values.join("=").trim();
		if (!key || !value) return;
		opts[key] = value;
	});
	if (opts.ip) {
		if (
			!opts.ip.match(
				/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
			)
		) {
			return new Response(null, { status: 400 });
		}
	}
	const token = request.headers.get("authorization");
	if (!token) return new Response(null, { status: 401 });
	// TODO: jwt utils which type and validate automatically
	const user = await useAuth(token);
	if (!user) return new Response(null, { status: 401 });
	const borkedIp = getClientAddress();
	const room = RoomManager.createRoom({
		name: body.name,
		description: parsedDescription[0] || "",
		gameName: body.preferredGameName,
		gameId: body.preferredGameId,
		players: [
			{
				gameId: 0,
				gameName: "",
				nickname: user.username,
			},
		],
		maxPlayers: body.maxPlayers,
		ip:
			opts.ip ||
			request.headers.get("CF-Connecting-IP") ||
			request.headers.get("X-Forwarded-For") ||
			(borkedIp.includes("127.0.0.1") ? "127.0.0.1" : borkedIp),
		port: body.port,
		host: user,
		hasPassword: body.hasPassword || false,
	});
	return json(room.toJSON());
}
