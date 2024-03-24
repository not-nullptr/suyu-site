import { building } from "$app/environment";
import { DISCORD_USER_TOKEN, GITLAB_API_TOKEN } from "$env/static/private";

let memberCount = 0;
let starCount = 0;
let roleMembers = {
	"1214817156420862012": 50,
};
let gitCommits = 0;

async function fetchServerSideData() {
	console.log("Fetching member count");

	const promises = [
		fetch("https://discord.com/api/v9/invites/suyu?with_counts=true&with_expiration=true"),
		DISCORD_USER_TOKEN
			? fetch("https://discord.com/api/v9/guilds/1214371687114477618/roles/member-counts", {
					headers: {
						Authorization: DISCORD_USER_TOKEN,
					},
				})
			: Promise.resolve({ json: () => roleMembers }),
		GITLAB_API_TOKEN
			? fetch("https://gitlab.com/api/v4/projects/suyu-emu%2Fsuyu/", {
					headers: {
						Authorization: `Bearer ${GITLAB_API_TOKEN}`,
					},
				})
			: Promise.resolve({ json: () => ({ star_count: 0 }) }), // Default to 0 if no token is provided
		fetch('https://git.suyu.dev/api/v1/repos/suyu/suyu/commits?stat=false&verification=false&files=false&limit=1')
	];

	const [res, roles, gitlabRes, suyuGitRes] = await Promise.all(promises);
	const jsonPromises = [res.json(), roles.json(), gitlabRes.json()];
	const [resJson, rolesJson, gitlabResJson] = await Promise.all(jsonPromises);

	
	memberCount = resJson.approximate_member_count;
	starCount = gitlabResJson.star_count;
	gitCommits = parseInt(suyuGitRes?.headers?.get('x-total'), 10) || 0;
	if (DISCORD_USER_TOKEN) roleMembers = rolesJson;

	console.log("Member count:", memberCount);
	console.log("Stars count:", starCount);
	console.log('Git commit count', gitCommits);
}

if (!building) {
	await fetchServerSideData();
	setInterval(fetchServerSideData, 1000 * 60 * 10);
}

export async function load({ cookies }) {
	const token = cookies.get("token");
	return {
		tokenCookie: token,
		memberCount,
		starCount,
		roleMembers,
		gitCommits
	};
}
