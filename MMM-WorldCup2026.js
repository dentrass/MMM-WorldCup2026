Module.register("MMM-WorldCup2026", {

	defaults: {
		updateInterval: 5 * 60 * 1000,
		rotateInterval: 20 * 1000,
		maxMatches: 5,
		favoriteTeam: "Sweden"
	},

	start() {

		this.loaded = false;
		this.viewIndex = 0;

		this.views = [
			"matches",
			"favorite",
			"groups",
			"results",
			"stadiums"
		];

		this.dataSet = {
			games: [],
			groups: [],
			stadiums: [],
			teams: [],
			favoriteGroup: null
		};

		this.getData();

		setInterval(() => {
			this.getData();
		}, this.config.updateInterval);

		setInterval(() => {
			this.viewIndex++;

			if (this.viewIndex >= this.views.length) {
				this.viewIndex = 0;
			}

			this.updateDom(500);
		}, this.config.rotateInterval);
	},

	getData() {
	this.sendSocketNotification(
		"GET_WC2026_DATA",
		{
			favoriteTeam: this.config.favoriteTeam
		}
	);
},

	socketNotificationReceived(notification, payload) {

		if (notification === "WC2026_DATA") {
			this.dataSet = payload;
			this.loaded = true;
			this.updateDom(1000);
		}

		if (notification === "WC2026_ERROR") {
			console.error(payload.error);
		}
	},

	getStyles() {
		return ["MMM-WorldCup2026.css"];
	},

	getFlag(iso2) {

		if (!iso2) {
			return "";
		}

		return `modules/MMM-WorldCup2026/flags/${iso2.toLowerCase()}.png`;
	},

	getCountdown(dateObj) {

		if (!dateObj) {
			return "";
		}

		const target = new Date(dateObj);
		const now = new Date();

		const diff = target - now;

		if (diff <= 0) {
			return "Live";
		}

		const days = Math.floor(diff / 86400000);
		const hours = Math.floor(
			(diff % 86400000) / 3600000
		);

		return `${days}d ${hours}h`;
	},

	getWorldCupCountdown() {

	const startDate =
		new Date("2026-06-11T19:00:00");

	const now = new Date();

	const diff =
		startDate - now;

	if (diff <= 0) {
		return "World Cup has started!";
	}

	const days =
		Math.floor(
			diff / 86400000
		);

	const hours =
		Math.floor(
			(diff % 86400000) /
			3600000
		);

	return `${days} days ${hours} hours`;
	},

	getDom() {

		const wrapper = document.createElement("div");
		wrapper.className = "wc2026-wrapper";

		if (!this.loaded) {

			wrapper.innerHTML = `
				<div class="wc-title">
					🏆 World Cup 2026
				</div>

				<div class="wc-loading">
					Loading World Cup data...
				</div>
			`;

			return wrapper;
		}

		const liveMatches =
			this.dataSet.games.filter(g => g.live);

		if (
			liveMatches.length > 0 &&
			this.views[this.viewIndex] !== "live"
		) {
			return this.renderLive();
		}

		const view = this.views[this.viewIndex];

		switch (view) {

			case "matches":
				return this.renderMatches();

			case "favorite":
				return this.renderFavoriteTeam();

			case "groups":
				return this.renderGroup();

			case "results":
				return this.renderResults();

			case "stadiums":
				return this.renderStadium();

			default:
				return wrapper;
		}
	},

	renderMatches() {

		const wrapper = document.createElement("div");
		wrapper.className = "wc2026-wrapper";

		wrapper.innerHTML = `
		<div class="wc-title">
			🏆 FIFA World Cup 2026
		</div>


		<div class="wc-title">
			Upcoming Matches
		</div>
	`;

		const upcoming = this.dataSet.games
			.filter(g => !g.finished)
			.slice(0, this.config.maxMatches);

		upcoming.forEach(game => {

			const row = document.createElement("div");
			row.className = "wc-match";

			row.innerHTML = `
				<div class="wc-match-row">

        <div class="wc-team">
            <img class="wc-flag"
                 src="${this.getFlag(game.homeTeam.iso2)}">
            <span>${game.homeTeam.name}</span>
        </div>

        <div class="wc-vs">vs</div>

        <div class="wc-team">
            <img class="wc-flag"
                 src="${this.getFlag(game.awayTeam.iso2)}">
            <span>${game.awayTeam.name}</span>
        </div>

    </div>

    <div class="wc-date">
        ${game.date}
    </div>
`;

			wrapper.appendChild(row);
		});

		return wrapper;
	},

	renderLive() {

		const wrapper = document.createElement("div");
		wrapper.className = "wc2026-wrapper";

		wrapper.innerHTML =
			`<div class="wc-title wc-live">LIVE</div>`;

		this.dataSet.games
			.filter(g => g.live)
			.forEach(game => {

				const row = document.createElement("div");

				row.className = "wc-result";

				row.innerHTML = `
					<div>
						${game.homeTeam.name}
						${game.homeScore}
						-
						${game.awayScore}
						${game.awayTeam.name}
					</div>

					<div class="wc-date">
						${game.timeElapsed}'
					</div>
				`;

				wrapper.appendChild(row);
			});

		return wrapper;
	},

	renderFavoriteTeam() {

		const wrapper = document.createElement("div");
		wrapper.className = "wc2026-wrapper";

		wrapper.innerHTML =
	`<div class="wc-title">
    Favorite Team: ${this.config.favoriteTeam}
</div>`;

		const matches =
			this.dataSet.games.filter(
				g => g.favoriteMatch
			);

		if (!matches.length) {

			wrapper.innerHTML += `
				<div class="wc-empty">
					No matches found
				</div>
			`;

			return wrapper;
		}

		const game =
    matches
        .filter(g => !g.finished)
        .sort(
            (a, b) =>
                new Date(a.dateObject) -
                new Date(b.dateObject)
        )[0] || matches[matches.length - 1];

		const nextMatch = document.createElement("div");

		nextMatch.innerHTML = `
    <div class="wc-match-row">

        <div class="wc-team">
            <img class="wc-flag"
                 src="${this.getFlag(game.homeTeam.iso2)}">
            <span>${game.homeTeam.name}</span>
        </div>

        <div class="wc-vs">vs</div>

        <div class="wc-team">
            <span>${game.awayTeam.name}</span>
            <img class="wc-flag"
                 src="${this.getFlag(game.awayTeam.iso2)}">
        </div>

    </div>

    <div class="wc-date">
        ${game.date}
    </div>
`;

		wrapper.appendChild(nextMatch);

		if (this.dataSet.favoriteGroup) {

			const title =
				document.createElement("div");

			title.className = "wc-title";
			title.style.marginTop = "10px";
			title.style.fontSize = "15px";

			title.innerHTML =
				`Group ${this.dataSet.favoriteGroup.name}`;

			wrapper.appendChild(title);

const header = document.createElement("div");

header.className = "wc-group-header";

header.innerHTML = `
    <span>Team</span>
    <span>MP</span>
    <span>GD</span>
    <span>Pts</span>
`;

wrapper.appendChild(header);

			this.dataSet.favoriteGroup.teams
				.forEach(teamRow => {

					if (!teamRow.team) return;

					const row =
						document.createElement("div");

					row.className =
						"wc-group-row";

					row.innerHTML = `
    <div class="wc-group-team">
        <img class="wc-flag"
             src="${this.getFlag(teamRow.team.iso2)}">

        <span>${teamRow.team.name}</span>
    </div>

    <div>${teamRow.mp}</div>
    <div>${teamRow.gd}</div>
    <div>${teamRow.pts}</div>
`;

					wrapper.appendChild(row);
				});
		}

		return wrapper;
	},

	renderGroup() {

	const wrapper = document.createElement("div");
	wrapper.className = "wc2026-wrapper";

	const groups =
		this.dataSet.groups || [];

	if (!groups.length) {

		wrapper.innerHTML =
			"No group data";

		return wrapper;
	}

	const index =
		Math.floor(Date.now() / 30000)
		% groups.length;

	const group = groups[index];

	wrapper.innerHTML = `
		<div class="wc-title">
			Group ${group.name}
		</div>

		<div class="wc-group-header">
			<span>Team</span>
			<span>MP</span>
			<span>GD</span>
			<span>Pts</span>
		</div>
	`;

	group.teams.forEach(teamRow => {

		if (!teamRow.team) return;

		const row =
			document.createElement("div");

		row.className =
			"wc-group-row";

		row.innerHTML = `
			<div class="wc-group-team">
				<img class="wc-flag"
				     src="${this.getFlag(teamRow.team.iso2)}">

				<span>
					${teamRow.team.name}
				</span>
			</div>

			<div>${teamRow.mp}</div>
			<div>${teamRow.gd}</div>
			<div>${teamRow.pts}</div>
		`;

		wrapper.appendChild(row);
	});

	return wrapper;
	},

	renderResults() {

		const wrapper = document.createElement("div");
		wrapper.className = "wc2026-wrapper";

		wrapper.innerHTML =
			`<div class="wc-title">
				Latest Results
			</div>`;

		this.dataSet.games
			.filter(g => g.finished)
			.slice(-10)
			.reverse()
			.forEach(game => {

				const row =
					document.createElement("div");

				row.className =
					"wc-result";

				row.innerHTML = `
	<div class="wc-match-row">

		<div class="wc-team">
			<img class="wc-flag"
			     src="${this.getFlag(game.homeTeam.iso2)}">
			<span>${game.homeTeam.name}</span>
		</div>

		<div class="wc-vs">
			${game.homeScore}
			-
			${game.awayScore}
		</div>

		<div class="wc-team">
			<span>${game.awayTeam.name}</span>
			<img class="wc-flag"
			     src="${this.getFlag(game.awayTeam.iso2)}">
		</div>

	</div>
`;

				wrapper.appendChild(row);
			});

		return wrapper;
	},

	renderStadium() {

		const wrapper = document.createElement("div");
		wrapper.className = "wc2026-wrapper";

		const stadiums =
			this.dataSet.stadiums || [];

		if (!stadiums.length) {

			wrapper.innerHTML =
				"No stadium data";

			return wrapper;
		}

		const index =
			Math.floor(Date.now() / 30000)
			% stadiums.length;

		const stadium = stadiums[index];

		wrapper.innerHTML = `
			<div class="wc-title">
				Stadium
			</div>

			<div class="wc-stadium-name">
				${stadium.name_en}
			</div>

			<div class="wc-stadium-city">
				${stadium.city_en}
			</div>

			<div class="wc-stadium-city">
				${stadium.country_en}
			</div>

			<div class="wc-stadium-capacity">
				Capacity: ${stadium.capacity}
			</div>
		`;

		return wrapper;
	}
});