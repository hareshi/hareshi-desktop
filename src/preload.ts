// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { Color, Titlebar } from "custom-electron-titlebar";
import { ipcRenderer } from "electron";
import { Activity } from "./types/presence";

window.addEventListener("DOMContentLoaded", () => {
	new Titlebar({
		backgroundColor: Color.fromHex("#332228"),
		iconSize: 20,
		titleHorizontalAlignment: "center",
	});

	/**
	 * Discord Presence
	 */
	const { host, hostname, href, search } = document.location,
		parameters = new URLSearchParams(href),
		pathArray = document.location.toString().split("/"),
		title = document.querySelector(".p-title-value")?.textContent?.trim(),
		presence = {
			state: title || "หน้าหลัก",
			timestamps: { start: Math.floor(Date.now() / 1000) },
		} as Activity;

	if (host === "www.hareshi.net" || host === "hareshi.net") {
		presence.details = "หน้าหลัก";
		presence.state = undefined;
		switch (pathArray[3]) {
			case "calendar":
				presence.details = "ตารางออกอากาศ";
				break;
			default:
				if (!pathArray[3]) break;
				presence.details = document.querySelectorAll("h1")[0]?.textContent?.trim();
				break;
		}
	} else if (hostname === "forum.hareshi.net") {
		presence.details = "ฟอรั่ม";
		switch (pathArray[3]) {
			case "forums":
				presence.details = "ฟอรั่ม";
				break;
			case "threads":
				presence.details = `เธรด ${
					document.querySelector("#top > div.p-body > div > div:nth-child(2) > div > ul > li:nth-child(2) > a > span")?.textContent?.trim() ?? ""
				}`;
				break;
			case "whats-new":
				presence.details = "มีอะไรใหม่ ?";
				presence.state = undefined;
				if (pathArray[4]) {
					switch (pathArray[4]) {
						case "posts":
							presence.assets.small_text = "ดูโพสต์ใหม่";
							break;
						case "profile-posts":
							presence.assets.small_text = "สเตตัสส่วนตัวใหม่";
							break;
						case "news-feed":
							presence.assets.small_text = "ฟีดข่าวของคุณ";
							break;
						case "latest-activity":
							presence.assets.small_text = "เคลื่อนไหวล่าสุด";
							break;
					}
				}
				break;
			case "members":
				presence.details = "สมาชิก";
				if (pathArray[5]) {
					switch (pathArray[5]) {
						case "#latest-activity":
							presence.assets.small_text = "เคลื่อนไหวล่าสุด";
							break;
						case "#recent-content":
							presence.assets.small_text = "โพสต์ทั้งหมด";
							break;
						case "#about":
							presence.assets.small_text = "เกี่ยวกับ";
							break;
						default:
							presence.assets.small_text = "ข้อความเยี่ยมชม";
							break;
					}
				}
				break;
			case "search":
				presence.details = "ค้นหา";
				presence.state = document.querySelector("#top > div.p-body-header > div > div > div > h1 > a > em")?.textContent ?? "ไม่พบข้อมูล";
				presence.assets.small_image = "search";
				break;
			case "tags":
				presence.details = "ค้นหาแท็ก";
				presence.assets.small_image = "search";
				break;
		}

		if (pathArray[4] === "find-source") {
			switch (parameters.get("order") || search) {
				case "reply_count":
					presence.assets.small_text = "ยอดนิยม";
					break;
				case "post_date":
					presence.assets.small_text = "ใหม่สุด";
					break;
				case "?unanswered=1":
					presence.assets.small_text = "ยังไม่มีคำตอบ";
					break;
				case "?your_questions=1":
					presence.assets.small_text = "คำถามของคุณ";
					break;
				case "?unsolved=1":
					presence.assets.small_text = "ยังไม่ถูกแก้";
					break;
				case "?your_answers=1":
					presence.assets.small_text = "คำตอบของคุณ";
					break;
				default:
					presence.assets.small_text = "อัปเดตล่าสุด";
					break;
			}
		}
	}

	if (presence.details)
		return ipcRenderer.send("presence", {
			currentURL: href,
			data: presence,
		});
});
