const NodeHelper = require("node_helper");
const axios = require("axios");

module.exports = NodeHelper.create({

	start() {
		console.log("MMM-WorldCup2026 node_helper v1.1 started");

		this.apiUrls = {
			games: "https://worldcup26.ir/get/games",
			teams: "https://worldcup26.ir/get/teams",
			groups: "https://worldcup26.ir/get/groups",
			stadiums: "https://worldcup26.ir/get/stadiums"
		};
	},

	socketNotificationReceived(notification, payload) {

	if (notification === "GET_WC2026_DATA") {

		this.favoriteTeam =
			payload?.favoriteTeam || "Sweden";

		this.getData();
	}
},

	parseDate(dateString) {

		if (!dateString) return new Date(2099, 0, 1);

		try {

			const [datePart, timePart] = dateString.split(" ");

			const [month, day, year] = datePart.split("/").map(Number);

			const [hour, minute] = timePart.split(":").map(Number);

			return new Date(
				year,
				month - 1,
				day,
				hour,
				minute
			);

		} catch (e) {

			return new Date(2099, 0, 1);
		}
	},

	async getData() {

		try {

			const [
				gamesRes,
				teamsRes,
				groupsRes,
				stadiumsRes
			] = await Promise.all([
				axios.get(this.apiUrls.games),
				axios.get(this.apiUrls.teams),
				axios.get(this.apiUrls.groups),
				axios.get(this.apiUrls.stadiums)
			]);

			const games = gamesRes.data.games || [];
			const teams = teamsRes.data.teams || [];
			const groups = groupsRes.data.groups || [];
			const stadiums = stadiumsRes.data.stadiums || [];

			const teamLookup = {};

			teams.forEach(team => {

				teamLookup[team.id] = {
					id: team.id,
					name: team.name_en,
					group: team.groups,
					iso2: (team.iso2 || "").toLowerCase(),
					fifaCode: team.fifa_code || ""
				};
			});

			const stadiumLookup = {};

			stadiums.forEach(stadium => {

				stadiumLookup[stadium.id] = {
					id: stadium.id,
					name: stadium.name_en,
					city: stadium.city_en,
					country: stadium.country_en,
					capacity: stadium.capacity
				};
			});

			const enrichedGames = games.map(game => {

				const matchDate = this.parseDate(
	game.local_date
);

const swedishDate = new Date(
    matchDate.getTime() + (8 * 60 * 60 * 1000)
);

const formattedDate =
	`${String(swedishDate.getDate()).padStart(2, "0")} ${swedishDate.toLocaleString("en-US", { month: "short" })} ${swedishDate.getFullYear()}`;
				
				const isLive =
					game.finished !== "TRUE" &&
					game.time_elapsed !== "notstarted";

				const isFinished =
					game.finished === "TRUE";

				const favoriteMatch =
	game.home_team_name_en === this.favoriteTeam ||
	game.away_team_name_en === this.favoriteTeam;

				return {

					id: game.id,

					group: game.group,
					matchday: game.matchday,

					date: formattedDate,
					dateObject: swedishDate,

					type: game.type,

					finished: isFinished,
					live: isLive,

					timeElapsed:
						game.time_elapsed || "0",

					homeTeam:
						teamLookup[game.home_team_id] || {
							name:
								game.home_team_name_en,
							iso2: ""
						},

					awayTeam:
						teamLookup[game.away_team_id] || {
							name:
								game.away_team_name_en,
							iso2: ""
						},

					homeScore:
						Number(
							game.home_score || 0
						),

					awayScore:
						Number(
							game.away_score || 0
						),

					stadium:
						stadiumLookup[
							game.stadium_id
						] || null,

					favoriteMatch
				};
			});

			// sortera matcher efter datum
			enrichedGames.sort((a, b) =>
				a.dateObject - b.dateObject
			);

			// grupptabeller med laginfo
			const enrichedGroups = groups.map(group => {

				const teamsWithInfo =
					group.teams.map(teamRow => {

						const team =
							teamLookup[
								teamRow.team_id
							];

						return {
							...teamRow,
							team
						};
					});

				teamsWithInfo.sort(
					(a, b) =>
						Number(b.pts) -
						Number(a.pts)
				);

				return {
					...group,
					teams: teamsWithInfo
				};
			});

			const favoriteGroup =
	enrichedGroups.find(g =>
		g.teams.some(
			t =>
				t.team &&
				t.team.name === this.favoriteTeam
		)
	);

			const payload = {

				lastUpdated:
					new Date().toISOString(),

				games: enrichedGames,

				groups: enrichedGroups,

				teams,

				teamLookup,

				stadiums,

				favoriteGroup
			};

			this.sendSocketNotification(
				"WC2026_DATA",
				payload
			);

		} catch (error) {

			console.error(
				"MMM-WorldCup2026:",
				error.message
			);

			this.sendSocketNotification(
				"WC2026_ERROR",
				{
					error: error.message
				}
			);
		}
	}
});