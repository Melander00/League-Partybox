import cp from 'child_process';
import { EventEmitter } from 'events';
import fs from 'fs';
import os from 'os';
import path from 'path';

const IS_WIN = process.platform === 'win32';
const IS_MAC = process.platform === 'darwin';
const IS_WSL =
	process.platform === 'linux' &&
	os.release().toLowerCase().includes('microsoft');

export interface LCUCredentials {
	protocol: string;
	address: string;
	port: number;
	username: string;
	password: string;
}

interface LockfileData {
	name: string;
	pid: number;
	port: number;
	password: string;
	protocol: string;
}

export default class LCUConnector extends EventEmitter {
	private _dirPath?: string;
	private _processWatcher?: NodeJS.Timeout;
	private _lockfileWatcher?: fs.FSWatcher;

	constructor(executablePath?: string) {
		super();

		if (executablePath) {
			this._dirPath = path.dirname(path.normalize(executablePath));
		}
	}

	public static async getLCUPathFromProcess(): Promise<string | undefined> {
		return new Promise(resolve => {
			const INSTALL_REGEX_WIN = /"--install-directory=(.*?)"/;
			const INSTALL_REGEX_MAC =
				/--install-directory=(.*?)( --|\n|$)/;

			const INSTALL_REGEX =
				IS_WIN || IS_WSL
					? INSTALL_REGEX_WIN
					: INSTALL_REGEX_MAC;

			const command = IS_WIN
				? `WMIC PROCESS WHERE name='LeagueClientUx.exe' GET commandline`
				: IS_WSL
					? `WMIC.exe PROCESS WHERE "name='LeagueClientUx.exe'" GET commandline`
					: `ps x -o args | grep 'LeagueClientUx'`;

			cp.exec(command, (err, stdout, stderr) => {
				if (err || !stdout || stderr) {
					resolve(undefined);
					return;
				}

				const parts = stdout.match(INSTALL_REGEX) || [];

				if (!parts[1]) {
					resolve(undefined);
					return;
				}

				let dirPath = parts[1];

				if (IS_WSL) {
					dirPath = dirPath
						.split(path.win32.sep)
						.join(path.sep)
						.replace(
							/^([a-zA-Z]):/,
							match => `/mnt/${match[0].toLowerCase()}`
						);
				}

				resolve(dirPath);
			});
		});
	}

	public static isValidLCUPath(dirPath?: string): boolean {
		if (!dirPath) {
			return false;
		}

		const lcuClientApp = IS_MAC
			? 'LeagueClient.app'
			: 'LeagueClient.exe';

		const common =
			fs.existsSync(path.join(dirPath, lcuClientApp)) &&
			fs.existsSync(path.join(dirPath, 'Config'));

		const isGlobal =
			common && fs.existsSync(path.join(dirPath, 'RADS'));

		const isCN =
			common && fs.existsSync(path.join(dirPath, 'TQM'));

		const isGarena = common;

		return isGlobal || isCN || isGarena;
	}

	public start(): void {
		if (LCUConnector.isValidLCUPath(this._dirPath)) {
			this._initLockfileWatcher();
			return;
		}

		this._initProcessWatcher();
	}

	public stop(): void {
		this._clearProcessWatcher();
		this._clearLockfileWatcher();
	}

	private _initLockfileWatcher(): void {
		if (this._lockfileWatcher || !this._dirPath) {
			return;
		}

		const lockfilePath = path.join(this._dirPath, 'lockfile');

		// Initial check
		if (fs.existsSync(lockfilePath)) {
			this._onFileCreated(lockfilePath);
		}

		this._lockfileWatcher = fs.watch(
			this._dirPath,
			(_eventType, filename) => {
				if (filename !== 'lockfile') {
					return;
				}

				const exists = fs.existsSync(lockfilePath);

				if (exists) {
					this._onFileCreated(lockfilePath);
				} else {
					this._onFileRemoved();
				}
			}
		);
	}

	private _clearLockfileWatcher(): void {
		if (this._lockfileWatcher) {
			this._lockfileWatcher.close();
			this._lockfileWatcher = undefined;
		}
	}

	private async _initProcessWatcher(): Promise<void> {
		const lcuPath =
			await LCUConnector.getLCUPathFromProcess();

		if (lcuPath) {
			this._dirPath = lcuPath;
			this._clearProcessWatcher();
			this._initLockfileWatcher();
			return;
		}

		if (!this._processWatcher) {
			this._processWatcher = setInterval(() => {
				void this._initProcessWatcher();
			}, 1000);
		}
	}

	private _clearProcessWatcher(): void {
		if (this._processWatcher) {
			clearInterval(this._processWatcher);
			this._processWatcher = undefined;
		}
	}

	private async _onFileCreated(lockfilePath: string): Promise<void> {
		try {
			const raw = await fs.promises.readFile(
				lockfilePath,
				'utf8'
			);

			// Format:
			// process:pid:port:password:protocol
			const parts = raw.trim().split(':');

			if (parts.length < 5) {
				return;
			}

			const data: LockfileData = {
				name: parts[0],
				pid: Number(parts[1]),
				port: Number(parts[2]),
				password: parts[3],
				protocol: parts[4]
			};

			const result: LCUCredentials = {
				protocol: data.protocol,
				address: '127.0.0.1',
				port: data.port,
				username: 'riot',
				password: data.password
			};

			this.emit('connect', result);
		} catch {
			// ignore read/parse errors
		}
	}

	private _onFileRemoved(): void {
		this.emit('disconnect');
	}
}