import type { IJwtData } from "$types/auth";
import type { Role } from "$types/db";
import { PUB_KEY } from "$env/static/private";
import jwt from "jsonwebtoken";

export function json<T>(body: T, status?: number): Response {
	return new Response(JSON.stringify(body), {
		headers: {
			"content-type": "application/json;charset=UTF-8",
		},
		status: status || 200,
	});
}

export async function getJwtData(token: string): Promise<IJwtData> {
	return new Promise((resolve, reject) => {
		jwt.verify(token, PUB_KEY, { algorithms: ["RS256"] }, (err, data) => {
			if (err) reject(err);
			else resolve(data as IJwtData);
		});
	});
}

export class RateLimiter {
	// allow 5 requests per minute

	cache = new Map<string, number>();

	constructor() {}

	isLimited(ip: string): boolean {
		// if the last request was in the last minute, return true
		if (this.cache.has(ip)) {
			if (Date.now() - this.cache.get(ip)! < 5000) {
				return true;
			}
		}
		// set the last request to now
		this.cache.set(ip, Date.now());
		return false;
	}
}
