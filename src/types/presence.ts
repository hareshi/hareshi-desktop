interface ActivityTimestamps {
	end?: Date | number;
	start?: Date | number;
}

interface ActivityAssets {
	large_image?: string;
	large_text?: string;
	small_image?: string;
	small_text?: string;
}

interface ActivityParty {
	id?: string;
	size: [number, number];
}

interface button {
	label: string;
	url: string;
}

export interface Activity {
	assets?: ActivityAssets;
	buttons?: [button] | [button, button];
	details: string;
	instance?: boolean;
	party?: ActivityParty;
	state: string;
	timestamps?: ActivityTimestamps;
}

export interface ResponseActivity extends Activity {
	application_id: string;
	name: string;
	type: number;
}

export interface DiscordEnvironment {
	config: {
		// cdn.discordapp.com
		api_endpoint: string;
		cdn_host: string; //discord.com/api, //ptb.discord.com/api or //canary.discord.com/api
		environment: string; // production
	};
	user: {
		avatar: string;
		bot: false;
		discriminator: string;
		flags: number;
		id: string;
		premium_type: number;
		username: string;
	};
}

export enum IPCOpcode {
	HANDSHAKE = 0,
	FRAME = 1,
	CLOSE = 2,
	PING = 3,
	PONG = 4,
}
